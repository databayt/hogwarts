/**
 * WhatsApp Bridge for In-App Messaging
 *
 * Bridges the in-app messaging system (Conversation/Message) with WhatsApp
 * delivery via the Evolution API. Handles phone resolution, dispatch, and
 * status tracking.
 */

import { db } from "@/lib/db"
import * as evolution from "@/lib/whatsapp/evolution-client"
import { checkAndConsumeRateLimit } from "@/lib/whatsapp/rate-limiter"

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
 * Dispatch an in-app message to WhatsApp for all eligible participants.
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
      const result = await evolution.sendText(
        session.instanceName,
        phone,
        content
      )

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
          content,
          contentType: "text",
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
