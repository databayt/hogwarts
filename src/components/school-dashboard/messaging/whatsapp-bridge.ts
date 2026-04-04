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

  // Get participants with WhatsApp phones (excluding sender)
  const participants = await db.conversationParticipant.findMany({
    where: {
      conversationId,
      isActive: true,
      userId: { not: senderUserId },
      whatsappPhone: { not: null },
    },
    select: { whatsappPhone: true },
  })

  if (participants.length === 0) return

  // Dynamic imports to avoid bundling WhatsApp client with messaging module
  const evolution = await import("@/lib/whatsapp/evolution-client")
  const { checkAndConsumeRateLimit } =
    await import("@/lib/whatsapp/rate-limiter")

  for (const participant of participants) {
    const phone = participant.whatsappPhone!

    // Check rate limits
    const rateCheck = checkAndConsumeRateLimit(schoolId)
    if (!rateCheck.allowed) {
      await db.message.update({
        where: { id: messageId },
        data: { whatsappStatus: "pending", whatsappPhone: phone },
      })
      continue
    }

    try {
      let result

      if (attachments.length > 0) {
        // Send each attachment as media message
        for (const attachment of attachments) {
          result = await evolution.sendMedia(
            session.instanceName,
            phone,
            attachment.fileUrl,
            {
              mediatype: mimeToMediaType(attachment.fileType),
              caption: content || undefined,
              fileName: attachment.fileName,
            }
          )
        }
      } else {
        // Text-only message
        result = await evolution.sendText(session.instanceName, phone, content)
      }

      if (!result) continue

      // Update message with WhatsApp tracking info
      await db.message.update({
        where: { id: messageId },
        data: {
          whatsappMessageId: result.key.id,
          whatsappStatus: "sent",
          whatsappPhone: phone,
        },
      })

      // Also log to WhatsAppMessage for audit
      await db.whatsAppMessage.create({
        data: {
          schoolId,
          sessionId: session.id,
          waMessageId: result.key.id,
          recipientPhone: phone,
          content: content || attachments[0]?.fileName || "",
          contentType:
            attachments.length > 0
              ? mimeToMediaType(attachments[0].fileType)
              : "text",
          direction: "outgoing",
          status: "sent",
          triggerType: "messaging",
          triggerId: messageId,
          sentAt: new Date(),
        },
      })
    } catch (error) {
      console.error(
        `[dispatchMessageToWhatsApp] Failed to send to ${phone}:`,
        error
      )
      await db.message.update({
        where: { id: messageId },
        data: {
          whatsappStatus: "failed",
          whatsappPhone: phone,
        },
      })
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
