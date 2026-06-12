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
  const { formatPhoneForWhatsApp } =
    await import("@/lib/whatsapp/evolution-client")
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
        // Canonical digits-only form (no +/00) — the inbound webhook resolves
        // senders by comparing JID digits against this column.
        data: { whatsappPhone: formatPhoneForWhatsApp(phone) },
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
    select: { id: true, userId: true, whatsappPhone: true },
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
  // last-writer-wins and break retry semantics. So: 1:1 dispatches mirror state
  // onto the Message scalars (retried via the Message sweep), while groups write
  // a per-recipient MessageWhatsappDelivery row (retried via the delivery sweep)
  // plus a WhatsAppMessage audit row. The two retry paths never overlap.
  const isSingleRecipient = participants.length === 1

  for (const participant of participants) {
    // Normalize at send time too — phones cached before normalization landed
    // may still carry +/00/space formats that Evolution rejects.
    const phone = evolution.formatPhoneForWhatsApp(participant.whatsappPhone!)

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
        await db.messageWhatsappDelivery.upsert({
          where: {
            messageId_participantId: {
              messageId,
              participantId: participant.id,
            },
          },
          create: {
            schoolId,
            messageId,
            participantId: participant.id,
            phone,
            status: "pending",
          },
          update: { status: "pending" },
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
      // For groups the scalar fields would clobber sibling recipients, so each
      // recipient's status goes to its own MessageWhatsappDelivery row instead.
      if (isSingleRecipient) {
        await db.message.update({
          where: { id: messageId },
          data: {
            whatsappMessageId: representativeResult.key.id,
            whatsappStatus: "sent",
            whatsappPhone: phone,
          },
        })
      } else {
        await db.messageWhatsappDelivery.upsert({
          where: {
            messageId_participantId: {
              messageId,
              participantId: participant.id,
            },
          },
          create: {
            schoolId,
            messageId,
            participantId: participant.id,
            phone,
            status: "sent",
            providerMessageId: representativeResult.key.id,
            sentAt: new Date(),
          },
          update: {
            status: "sent",
            providerMessageId: representativeResult.key.id,
            sentAt: new Date(),
            lastError: null,
          },
        })
      }
    } catch (error) {
      console.error(
        `[dispatchMessageToWhatsApp] Failed to send to ${phone}:`,
        error
      )
      // Instance deleted / API key invalid — the session is dead, every
      // further send this run will fail the same way. Mark it so the
      // dashboard shows the truth and retry sweeps stop hammering Evolution.
      if (evolution.isInstanceGoneError(error)) {
        await db.whatsAppSession
          .update({
            where: { schoolId },
            data: { status: "disconnected" },
          })
          .catch(() => {})
        console.error(
          `[dispatchMessageToWhatsApp] Evolution instance gone for school ${schoolId} — session marked disconnected`
        )
      }
      if (isSingleRecipient) {
        await db.message.update({
          where: { id: messageId },
          data: { whatsappStatus: "failed", whatsappPhone: phone },
        })
      } else {
        const lastError = error instanceof Error ? error.message : String(error)
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
        await db.messageWhatsappDelivery.upsert({
          where: {
            messageId_participantId: {
              messageId,
              participantId: participant.id,
            },
          },
          create: {
            schoolId,
            messageId,
            participantId: participant.id,
            phone,
            status: "failed",
            lastError,
          },
          update: { status: "failed", lastError },
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

  // --- Part B: group fan-out — per-recipient MessageWhatsappDelivery rows ---
  // 1:1 dispatches live on the Message scalars (Part A); groups can't, so each
  // recipient is retried independently here (re-dispatching the whole message
  // would double-send to already-delivered recipients).
  const failedDeliveries = await db.messageWhatsappDelivery.findMany({
    where: {
      status: { in: ["failed", "pending"] },
      retryCount: { lt: MAX_RETRY_ATTEMPTS },
      message: { conversation: { whatsappEnabled: true } },
    },
    select: {
      id: true,
      schoolId: true,
      phone: true,
      retryCount: true,
      updatedAt: true,
      message: {
        select: {
          content: true,
          attachments: {
            select: { fileUrl: true, fileType: true, fileName: true },
          },
        },
      },
    },
    take: 20,
    orderBy: { createdAt: "asc" },
  })

  if (failedDeliveries.length > 0) {
    const evolution = await import("@/lib/whatsapp/evolution-client")
    const { checkAndConsumeRateLimit } =
      await import("@/lib/whatsapp/rate-limiter")
    // One session lookup per school, reused across that school's deliveries.
    const sessionCache = new Map<
      string,
      { instanceName: string; status: string } | null
    >()

    for (const delivery of failedDeliveries) {
      // Exponential backoff keyed off the row's own retryCount + updatedAt.
      const backoffMs = BASE_RETRY_DELAY_MS * Math.pow(2, delivery.retryCount)
      if (Date.now() - new Date(delivery.updatedAt).getTime() < backoffMs) {
        skipped++
        continue
      }

      let session = sessionCache.get(delivery.schoolId)
      if (session === undefined) {
        session = await db.whatsAppSession.findUnique({
          where: { schoolId: delivery.schoolId },
          select: { instanceName: true, status: true },
        })
        sessionCache.set(delivery.schoolId, session)
      }
      if (!session || session.status !== "connected") {
        skipped++
        continue
      }

      const rateCheck = await checkAndConsumeRateLimit(delivery.schoolId)
      if (!rateCheck.allowed) {
        skipped++
        continue
      }

      try {
        const atts = delivery.message.attachments
        const phone = evolution.formatPhoneForWhatsApp(delivery.phone)
        let providerMessageId: string | undefined
        if (atts.length > 0) {
          for (const a of atts) {
            const r = await evolution.sendMedia(
              session.instanceName,
              phone,
              a.fileUrl,
              {
                mediatype: mimeToMediaType(a.fileType),
                caption: delivery.message.content || undefined,
                fileName: a.fileName,
              }
            )
            if (!providerMessageId) providerMessageId = r.key.id
          }
        } else {
          const r = await evolution.sendText(
            session.instanceName,
            phone,
            delivery.message.content
          )
          providerMessageId = r.key.id
        }
        await db.messageWhatsappDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "sent",
            providerMessageId,
            sentAt: new Date(),
            lastError: null,
            retryCount: { increment: 1 },
          },
        })
        sent++
      } catch (error) {
        await db.messageWhatsappDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "failed",
            lastError: error instanceof Error ? error.message : String(error),
            retryCount: { increment: 1 },
          },
        })
        failed++
        // Dead instance: mark the session and stop retrying this school's
        // deliveries for the rest of the run.
        if (evolution.isInstanceGoneError(error)) {
          await db.whatsAppSession
            .update({
              where: { schoolId: delivery.schoolId },
              data: { status: "disconnected" },
            })
            .catch(() => {})
          sessionCache.set(delivery.schoolId, null)
        }
      }
    }
  }

  return {
    processed: failedMessages.length + failedDeliveries.length,
    sent,
    failed,
    skipped,
  }
}
