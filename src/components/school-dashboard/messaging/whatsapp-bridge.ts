/**
 * WhatsApp Bridge for In-App Messaging
 *
 * Bridges the in-app messaging system (Conversation/Message) with WhatsApp
 * delivery via the Evolution API. Handles phone resolution, dispatch, and
 * status tracking. Includes retry with exponential backoff for failed sends.
 */

import { db } from "@/lib/db"

const MAX_RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 1000 // 1s, 2s, 4s, 8s, 16s

/**
 * Resolve a user's WhatsApp-reachable phone number.
 * Checks: Guardian phone → Teacher phone → null
 */
export async function resolveWhatsAppPhone(
  userId: string
): Promise<string | null> {
  const guardian = await db.guardian.findUnique({
    where: { userId },
    include: {
      phoneNumbers: { where: { isPrimary: true }, take: 1 },
    },
  })
  if (guardian?.phoneNumbers[0]?.phoneNumber) {
    return guardian.phoneNumbers[0].phoneNumber
  }

  const teacher = await db.teacher.findUnique({
    where: { userId },
    include: {
      phoneNumbers: { where: { isPrimary: true }, take: 1 },
    },
  })
  if (teacher?.phoneNumbers[0]?.phoneNumber) {
    return teacher.phoneNumbers[0].phoneNumber
  }

  // StaffMember (covers Accountant, Staff roles)
  const staffMember = await db.staffMember.findFirst({
    where: { userId },
    include: {
      staffPhoneNumbers: { where: { isPrimary: true }, take: 1 },
    },
  })
  if (staffMember?.staffPhoneNumbers[0]?.phoneNumber) {
    return staffMember.staffPhoneNumbers[0].phoneNumber
  }

  return null
}

/**
 * Populate whatsappPhone for all participants in a conversation.
 * Called when WhatsApp is enabled on a conversation.
 */
export async function populateParticipantPhones(
  schoolId: string,
  conversationId: string
): Promise<void> {
  const participants = await db.conversationParticipant.findMany({
    where: { conversationId, isActive: true },
    select: { id: true, userId: true, whatsappPhone: true },
  })

  for (const p of participants) {
    if (p.whatsappPhone) continue // Already cached
    const phone = await resolveWhatsAppPhone(p.userId)
    if (phone) {
      await db.conversationParticipant.update({
        where: { id: p.id },
        data: { whatsappPhone: phone },
      })
    }
  }
}

/**
 * Map MIME type to Evolution API mediatype
 */
function mimeToMediaType(
  mime: string
): "image" | "document" | "audio" | "video" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "document"
}

/**
 * Dispatch an in-app message to WhatsApp for all eligible participants.
 * Handles text, images, documents, audio, and video.
 * Non-blocking — errors are logged but don't fail the in-app message.
 */
export async function dispatchMessageToWhatsApp(
  schoolId: string,
  conversationId: string,
  messageId: string,
  content: string,
  senderUserId: string
): Promise<void> {
  // Get school's WhatsApp session
  const session = await db.whatsAppSession.findUnique({
    where: { schoolId },
    select: { id: true, instanceName: true, status: true },
  })

  if (!session || session.status !== "connected") {
    return // No active WhatsApp session
  }

  // Get message attachments
  const messageWithAttachments = await db.message.findUnique({
    where: { id: messageId },
    select: {
      attachments: {
        select: {
          fileUrl: true,
          fileType: true,
          fileName: true,
        },
      },
    },
  })

  const attachments = messageWithAttachments?.attachments ?? []

  // Get active participants (excluding sender), then split into reachable
  // (cached WhatsApp phone) vs unreachable. Plain User rows with no
  // Guardian/Teacher/StaffMember profile have no resolvable phone — surface
  // that explicitly instead of silently dropping them, so admins can see who
  // is unreachable on WhatsApp.
  const allParticipants = await db.conversationParticipant.findMany({
    where: {
      conversationId,
      isActive: true,
      userId: { not: senderUserId },
    },
    select: { userId: true, whatsappPhone: true },
  })

  const participants = allParticipants.filter((p) => p.whatsappPhone)
  const unreachable = allParticipants.filter((p) => !p.whatsappPhone)
  if (unreachable.length > 0) {
    console.warn(
      `[whatsapp-bridge] ${unreachable.length}/${allParticipants.length} ` +
        `participant(s) in conversation ${conversationId} have no WhatsApp ` +
        `phone (no Guardian/Teacher/StaffMember number) — skipped`,
      unreachable.map((p) => p.userId)
    )
  }

  if (participants.length === 0) return

  // Dynamic imports to avoid bundling WhatsApp client with messaging module
  const evolution = await import("@/lib/whatsapp/evolution-client")
  const { checkAndConsumeRateLimit } =
    await import("@/lib/whatsapp/rate-limiter")

  // Message has scalar whatsappPhone/whatsappStatus/whatsappMessageId columns,
  // but groups fan out to N recipients. Writing those scalars in a loop would
  // last-writer-wins and break retry semantics. Only mirror scalar state for
  // 1:1 dispatches (one recipient); for groups, rely on per-recipient
  // WhatsAppMessage rows below. Until a MessageWhatsappDelivery join table
  // lands, group retries are best-effort via WhatsAppMessage audit rows only.
  const isSingleRecipient = participants.length === 1

  for (const participant of participants) {
    const phone = participant.whatsappPhone!

    // Check rate limits
    const rateCheck = await checkAndConsumeRateLimit(schoolId)
    if (!rateCheck.allowed) {
      if (isSingleRecipient) {
        await db.message.update({
          where: { id: messageId },
          data: { whatsappStatus: "pending", whatsappPhone: phone },
        })
      } else {
        // Record a per-recipient pending row so the cron retry path has a handle.
        await db.whatsAppMessage.create({
          data: {
            schoolId,
            sessionId: session.id,
            recipientPhone: phone,
            content: content || attachments[0]?.fileName || "",
            contentType:
              attachments.length > 0
                ? mimeToMediaType(attachments[0].fileType)
                : "text",
            direction: "outgoing",
            status: "pending",
            triggerType: "messaging",
            triggerId: messageId,
          },
        })
      }
      continue
    }

    try {
      let representativeResult:
        | Awaited<ReturnType<typeof evolution.sendMedia>>
        | Awaited<ReturnType<typeof evolution.sendText>>
        | undefined

      if (attachments.length > 0) {
        // Send each attachment as its own media message and log each to the
        // audit table. `result` previously got overwritten per iteration, so
        // only the last attachment's WA id survived — fixed by persisting
        // every send here and keeping the first one as the representative.
        for (const attachment of attachments) {
          const attachmentResult = await evolution.sendMedia(
            session.instanceName,
            phone,
            attachment.fileUrl,
            {
              mediatype: mimeToMediaType(attachment.fileType),
              caption: content || undefined,
              fileName: attachment.fileName,
            }
          )
          if (!representativeResult) representativeResult = attachmentResult
          await db.whatsAppMessage.create({
            data: {
              schoolId,
              sessionId: session.id,
              waMessageId: attachmentResult.key.id,
              recipientPhone: phone,
              content: attachment.fileName,
              contentType: mimeToMediaType(attachment.fileType),
              direction: "outgoing",
              status: "sent",
              triggerType: "messaging",
              triggerId: messageId,
              sentAt: new Date(),
            },
          })
        }
      } else {
        representativeResult = await evolution.sendText(
          session.instanceName,
          phone,
          content
        )
        await db.whatsAppMessage.create({
          data: {
            schoolId,
            sessionId: session.id,
            waMessageId: representativeResult.key.id,
            recipientPhone: phone,
            content,
            contentType: "text",
            direction: "outgoing",
            status: "sent",
            triggerType: "messaging",
            triggerId: messageId,
            sentAt: new Date(),
          },
        })
      }

      if (!representativeResult) continue

      // Only mirror WA state onto the Message row for 1:1 conversations.
      // For groups the scalar fields would clobber sibling recipients.
      if (isSingleRecipient) {
        await db.message.update({
          where: { id: messageId },
          data: {
            whatsappMessageId: representativeResult.key.id,
            whatsappStatus: "sent",
            whatsappPhone: phone,
          },
        })
      }
    } catch (error) {
      console.error(
        `[dispatchMessageToWhatsApp] Failed to send to ${phone}:`,
        error
      )
      if (isSingleRecipient) {
        await db.message.update({
          where: { id: messageId },
          data: { whatsappStatus: "failed", whatsappPhone: phone },
        })
      } else {
        await db.whatsAppMessage.create({
          data: {
            schoolId,
            sessionId: session.id,
            recipientPhone: phone,
            content: content || attachments[0]?.fileName || "",
            contentType:
              attachments.length > 0
                ? mimeToMediaType(attachments[0].fileType)
                : "text",
            direction: "outgoing",
            status: "failed",
            triggerType: "messaging",
            triggerId: messageId,
          },
        })
      }
    }
  }
}

/**
 * Sync read receipts back to WhatsApp.
 * Called when a user reads messages that were originally sent via WhatsApp.
 */
export async function syncReadReceiptsToWhatsApp(
  schoolId: string,
  conversationId: string,
  messageIds: string[]
): Promise<void> {
  const session = await db.whatsAppSession.findUnique({
    where: { schoolId },
    select: { instanceName: true, status: true },
  })

  if (!session || session.status !== "connected") return

  // Find messages with WhatsApp IDs that need read sync
  const messages = await db.message.findMany({
    where: {
      id: { in: messageIds },
      conversationId,
      whatsappMessageId: { not: null },
      whatsappStatus: { not: "read" },
    },
    select: { whatsappMessageId: true, whatsappPhone: true },
  })

  if (messages.length === 0) return

  const evolution = await import("@/lib/whatsapp/evolution-client")

  for (const msg of messages) {
    if (!msg.whatsappMessageId || !msg.whatsappPhone) continue
    try {
      await evolution.readMessages(session.instanceName, msg.whatsappPhone, [
        msg.whatsappMessageId,
      ])
    } catch (error) {
      console.error(
        `[syncReadReceiptsToWhatsApp] Failed for ${msg.whatsappMessageId}:`,
        error
      )
    }
  }
}

/**
 * Retry failed WhatsApp message dispatches.
 * Called by cron job. Processes messages with whatsappStatus="failed" or "pending"
 * that were triggered by the messaging system.
 *
 * Uses exponential backoff: 1s, 2s, 4s, 8s, 16s (based on retry count stored in metadata).
 */
export async function retryFailedMessageDispatches(): Promise<{
  processed: number
  sent: number
  failed: number
  skipped: number
}> {
  // Find messages that need retry
  const failedMessages = await db.message.findMany({
    where: {
      whatsappStatus: { in: ["failed", "pending"] },
      whatsappPhone: { not: null },
      conversation: { whatsappEnabled: true },
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      whatsappPhone: true,
      metadata: true,
      conversation: { select: { schoolId: true } },
    },
    take: 20,
    orderBy: { createdAt: "asc" },
  })

  if (failedMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 }
  }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const msg of failedMessages) {
    const metadata = (msg.metadata as Record<string, unknown>) ?? {}
    const retryCount = (metadata.waRetryCount as number) ?? 0

    // Skip if max retries exceeded
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      skipped++
      continue
    }

    // Check backoff delay
    const backoffMs = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount)
    const lastAttempt = metadata.waLastAttempt as string | undefined
    if (lastAttempt) {
      const elapsed = Date.now() - new Date(lastAttempt).getTime()
      if (elapsed < backoffMs) {
        skipped++
        continue
      }
    }

    // Update retry metadata
    await db.message.update({
      where: { id: msg.id },
      data: {
        metadata: {
          ...metadata,
          waRetryCount: retryCount + 1,
          waLastAttempt: new Date().toISOString(),
        },
      },
    })

    try {
      // Re-dispatch
      await dispatchMessageToWhatsApp(
        msg.conversation.schoolId,
        msg.conversationId,
        msg.id,
        msg.content,
        msg.senderId
      )
      sent++
    } catch {
      failed++
    }
  }

  return {
    processed: failedMessages.length,
    sent,
    failed,
    skipped,
  }
}
