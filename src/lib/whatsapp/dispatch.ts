/**
 * WhatsApp Notification Dispatch
 *
 * Bridges the notification system with WhatsApp delivery.
 * Called by cron job to process pending WhatsApp notifications.
 */

import { db } from "@/lib/db"

import * as evolution from "./evolution-client"
import { checkAndConsumeRateLimit } from "./rate-limiter"

/**
 * Resolve a user's phone number from their role-specific profile.
 * Checks: Guardian → Teacher → StaffMember (Accountant/Staff) → null
 *
 * Keep this aligned with `resolveWhatsAppPhone` in
 * `src/components/school-dashboard/messaging/whatsapp-bridge.ts` so that
 * cron-driven notifications and message-triggered WhatsApp dispatch reach
 * the same set of users.
 */
async function resolveUserPhone(userId: string): Promise<string | null> {
  // Check guardian phone numbers
  const guardian = await db.guardian.findUnique({
    where: { userId },
    include: {
      phoneNumbers: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  })
  if (guardian?.phoneNumbers[0]?.phoneNumber) {
    return guardian.phoneNumbers[0].phoneNumber
  }

  // Check teacher phone numbers
  const teacher = await db.teacher.findUnique({
    where: { userId },
    include: {
      phoneNumbers: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  })
  if (teacher?.phoneNumbers[0]?.phoneNumber) {
    return teacher.phoneNumbers[0].phoneNumber
  }

  // Check staff member phone numbers (covers Accountant, Staff roles)
  const staffMember = await db.staffMember.findFirst({
    where: { userId },
    include: {
      staffPhoneNumbers: { where: { isPrimary: true }, take: 1 },
    },
  })
  if (staffMember?.staffPhoneNumbers[0]?.phoneNumber) {
    return staffMember.staffPhoneNumbers[0].phoneNumber
  }

  // Check the student's own contact (students receive their own fee /
  // attendance reminders — previously skipped, so a student-targeted WhatsApp
  // reminder always resolved to null and silently failed). The User model has
  // no phone field, so Student mobile/alternate is the last resort.
  const student = await db.student.findFirst({
    where: { userId },
    select: { mobileNumber: true, alternatePhone: true },
  })
  if (student?.mobileNumber) return student.mobileNumber
  if (student?.alternatePhone) return student.alternatePhone

  return null
}

/**
 * Process pending WhatsApp notifications.
 * Finds notifications with whatsapp channel that haven't been sent yet.
 * Called by cron job every 5 minutes.
 */
export async function processWhatsAppNotifications(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const notifications = await db.notification.findMany({
    where: {
      channels: { has: "whatsapp" },
      whatsappSent: false,
      whatsappError: null,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 50,
  })

  if (notifications.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const notification of notifications) {
    const { userId, schoolId } = notification

    // Resolve phone number from user's role profile
    const phoneNumber = await resolveUserPhone(userId)
    if (!phoneNumber) {
      await db.notification.update({
        where: { id: notification.id },
        data: { whatsappError: "No phone number found for user" },
      })
      failed++
      continue
    }

    // Get WhatsApp session for this school
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
      select: {
        instanceName: true,
        status: true,
        id: true,
        connectedAt: true,
      },
    })

    if (!session || session.status !== "connected") {
      await db.notification.update({
        where: { id: notification.id },
        data: { whatsappError: "WhatsApp not connected for this school" },
      })
      failed++
      continue
    }

    // Rate limit check
    const rateCheck = await checkAndConsumeRateLimit(schoolId, {
      connectedSince: session.connectedAt ?? undefined,
    })

    if (!rateCheck.allowed) {
      // Skip, will retry next cycle
      continue
    }

    try {
      const messageText = `${notification.title}\n\n${notification.body}`

      const result = await evolution.sendText(
        session.instanceName,
        evolution.formatPhoneForWhatsApp(phoneNumber),
        messageText
      )

      // Log the message
      await db.whatsAppMessage.create({
        data: {
          schoolId,
          sessionId: session.id,
          recipientPhone: phoneNumber,
          waMessageId: result.key.id,
          content: messageText,
          contentType: "text",
          direction: "outgoing",
          status: "sent",
          sentAt: new Date(),
          triggerType: notification.type,
          triggerId: notification.id,
        },
      })

      // Mark as sent
      await db.notification.update({
        where: { id: notification.id },
        data: {
          whatsappSent: true,
          whatsappSentAt: new Date(),
        },
      })

      // Log delivery
      await db.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          channel: "whatsapp",
          recipientPhone: phoneNumber,
          status: "sent",
          provider: "evolution-api",
          providerId: result.key.id,
          sentAt: new Date(),
        },
      })

      sent++
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      await db.notification.update({
        where: { id: notification.id },
        data: { whatsappError: errorMessage },
      })

      await db.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          channel: "whatsapp",
          recipientPhone: phoneNumber,
          status: "failed",
          statusMessage: errorMessage,
          provider: "evolution-api",
        },
      })

      failed++
    }

    // Throttle: 1 second between messages
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return { processed: notifications.length, sent, failed }
}
