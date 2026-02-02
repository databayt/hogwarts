"use server"

import type { NotificationPriority, NotificationType } from "@prisma/client"
import { Resend } from "resend"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY)

// ============================================================================
// Types
// ============================================================================

export interface NotificationEmailParams {
  notificationId: string
  to: string
  locale: "ar" | "en"
  type: NotificationType
  priority: NotificationPriority
  title: string
  body: string
  metadata?: Record<string, unknown> | null
  actorName?: string | null
}

export interface EmailDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Generate notification email HTML
 * Supports RTL for Arabic locale
 */
function generateNotificationEmailHtml(
  params: NotificationEmailParams
): string {
  const { locale, type, priority, title, body, metadata, actorName } = params
  const isRtl = locale === "ar"
  const direction = isRtl ? "rtl" : "ltr"
  const align = isRtl ? "right" : "left"

  // Priority colors
  const priorityColors: Record<NotificationPriority, string> = {
    low: "#6b7280",
    normal: "#3b82f6",
    high: "#f59e0b",
    urgent: "#ef4444",
  }
  const priorityColor = priorityColors[priority]

  // Type label - format from type enum (config only has icon, not label)
  const typeLabel = type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Action URL from metadata
  const actionUrl =
    metadata && typeof metadata === "object" && "url" in metadata
      ? (metadata.url as string)
      : null

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${direction}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          body {
            font-family: ${isRtl ? "'Rubik', 'Segoe UI', Roboto, Arial, sans-serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"};
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            direction: ${direction};
            text-align: ${align};
          }
          .card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 24px;
            color: white;
          }
          .content {
            padding: 24px;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            background: ${priorityColor}20;
            color: ${priorityColor};
            margin-bottom: 12px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 16px;
          }
          .body-text {
            font-size: 16px;
            color: #4b5563;
            margin: 0 0 20px;
          }
          .actor {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 16px;
          }
          .action-button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span style="font-size: 14px; opacity: 0.8;">${typeLabel}</span>
          </div>
          <div class="content">
            <span class="priority-badge">${priority}</span>
            <h1 class="title">${title}</h1>
            ${actorName ? `<p class="actor">${isRtl ? "من:" : "From:"} ${actorName}</p>` : ""}
            <p class="body-text">${body}</p>
            ${
              actionUrl
                ? `
              <a href="${actionUrl}" class="action-button">
                ${isRtl ? "عرض التفاصيل" : "View Details"}
              </a>
            `
                : ""
            }
          </div>
        </div>
        <div class="footer">
          ${isRtl ? "تم إرسال هذا الإشعار من بوابة المدرسة" : "This notification was sent from School Portal"}
          <br>
          ${isRtl ? "يمكنك إدارة تفضيلات الإشعارات من إعدادات حسابك" : "You can manage notification preferences in your account settings"}
        </div>
      </body>
    </html>
  `
}

/**
 * Generate plain text version for email
 */
function generateNotificationEmailText(
  params: NotificationEmailParams
): string {
  const { locale, title, body, actorName, metadata } = params
  const isRtl = locale === "ar"

  const actionUrl =
    metadata && typeof metadata === "object" && "url" in metadata
      ? (metadata.url as string)
      : null

  return `
${title}
${"-".repeat(title.length)}

${actorName ? `${isRtl ? "من:" : "From:"} ${actorName}\n` : ""}
${body}

${actionUrl ? `\n${isRtl ? "عرض التفاصيل:" : "View Details:"} ${actionUrl}` : ""}

---
${isRtl ? "تم إرسال هذا الإشعار من بوابة المدرسة" : "This notification was sent from School Portal"}
  `.trim()
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  params: NotificationEmailParams
): Promise<EmailDeliveryResult> {
  const from = env.EMAIL_FROM ?? "School Portal <noreply@school.databayt.org>"

  // In development, use Resend's test recipient
  const recipient =
    process.env.NODE_ENV === "development" ? "delivered@resend.dev" : params.to

  try {
    const html = generateNotificationEmailHtml(params)
    const text = generateNotificationEmailText(params)

    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject: params.title,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": params.notificationId,
        "X-Notification-Type": params.type,
        "X-Notification-Priority": params.priority,
      },
    })

    if (error) {
      console.error("[NotificationEmail] Resend error:", error)

      // Log delivery failure
      await logDeliveryAttempt({
        notificationId: params.notificationId,
        channel: "email",
        status: "failed",
        error: error.message,
      })

      return {
        success: false,
        error: error.message,
      }
    }

    // Log successful delivery
    await logDeliveryAttempt({
      notificationId: params.notificationId,
      channel: "email",
      status: "sent",
      providerId: data?.id,
    })

    // Update notification emailSent flag
    await db.notification.update({
      where: { id: params.notificationId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error("[NotificationEmail] Failed to send:", error)

    await logDeliveryAttempt({
      notificationId: params.notificationId,
      channel: "email",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Log delivery attempt to NotificationDeliveryLog
 */
async function logDeliveryAttempt(data: {
  notificationId: string
  channel: "email" | "push" | "sms" | "in_app"
  status: string
  error?: string
  providerId?: string
}): Promise<void> {
  try {
    await db.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: data.channel,
        status: data.status,
        statusMessage: data.error,
        provider: "resend",
        providerId: data.providerId,
        sentAt: data.status === "sent" ? new Date() : null,
      },
    })
  } catch (error) {
    console.error("[NotificationEmail] Failed to log delivery:", error)
  }
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process pending email notifications in batch
 * Called by cron job
 */
export async function processPendingEmailNotifications(
  schoolId?: string,
  limit = 50
): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  // Get pending notifications that should be sent via email
  const pending = await db.notification.findMany({
    where: {
      ...(schoolId && { schoolId }),
      emailSent: false,
      channels: { has: "email" },
    },
    take: limit,
    orderBy: [
      { priority: "desc" }, // Process urgent first
      { createdAt: "asc" }, // Then by oldest
    ],
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
      actor: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  })

  let succeeded = 0
  let failed = 0

  for (const notification of pending) {
    // Check user preference
    const shouldSend = await checkEmailPreference(
      notification.schoolId,
      notification.userId,
      notification.type
    )

    if (!shouldSend) {
      // Skip and mark as not needed
      await db.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true, // Mark as processed (skipped)
          emailError: "User preference: email disabled",
        },
      })
      continue
    }

    // Skip if user has no email address
    if (!notification.user.email) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true, // Mark as processed (skipped)
          emailError: "User has no email address",
        },
      })
      continue
    }

    const result = await sendNotificationEmail({
      notificationId: notification.id,
      to: notification.user.email,
      locale: "en", // TODO: Get from user preferences
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      body: notification.body,
      metadata: notification.metadata as Record<string, unknown> | null,
      actorName: notification.actor?.username || notification.actor?.email,
    })

    if (result.success) {
      succeeded++
    } else {
      failed++
      // Update with error
      await db.notification.update({
        where: { id: notification.id },
        data: {
          emailError: result.error,
        },
      })
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
  }
}

/**
 * Check if user wants to receive email for this notification type
 */
async function checkEmailPreference(
  schoolId: string,
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const preference = await db.notificationPreference.findFirst({
    where: {
      schoolId,
      userId,
      type,
      channel: "email",
    },
    select: {
      enabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  })

  // Default: send if no preference set
  if (!preference) return true

  // Check if disabled
  if (!preference.enabled) return false

  // Check quiet hours
  if (
    preference.quietHoursStart !== null &&
    preference.quietHoursEnd !== null
  ) {
    const now = new Date()
    const currentHour = now.getHours()

    if (preference.quietHoursStart < preference.quietHoursEnd) {
      // Normal range (e.g., 22-8)
      if (
        currentHour >= preference.quietHoursStart &&
        currentHour < preference.quietHoursEnd
      ) {
        return false
      }
    } else {
      // Overnight range (e.g., 22-8 next day)
      if (
        currentHour >= preference.quietHoursStart ||
        currentHour < preference.quietHoursEnd
      ) {
        return false
      }
    }
  }

  return true
}

// ============================================================================
// Batch Notification Processing
// ============================================================================

/**
 * Process a notification batch - creates individual notifications and sends emails
 */
export async function processNotificationBatch(
  batchId: string,
  schoolId: string,
  createdById: string
): Promise<{
  success: boolean
  created: number
  errors: string[]
}> {
  const batch = await db.notificationBatch.findFirst({
    where: { id: batchId, schoolId },
  })

  if (!batch) {
    return { success: false, created: 0, errors: ["Batch not found"] }
  }

  // Update status to processing
  await db.notificationBatch.update({
    where: { id: batchId },
    data: { status: "processing" },
  })

  const errors: string[] = []
  let created = 0

  try {
    // Determine target users
    let targetUserIds: string[] = batch.targetUserIds

    if (batch.targetRole) {
      // Get users by role
      const users = await db.user.findMany({
        where: {
          schoolId,
          role: batch.targetRole,
        },
        select: { id: true },
      })
      targetUserIds = [...targetUserIds, ...users.map((u) => u.id)]
    }

    if (batch.targetClassId) {
      // Get students in class via studentClass join table
      const studentClasses = await db.studentClass.findMany({
        where: {
          schoolId,
          classId: batch.targetClassId,
        },
        select: {
          student: {
            select: { userId: true },
          },
        },
      })
      // Filter out students without linked user accounts
      const studentUserIds = studentClasses
        .map((sc) => sc.student.userId)
        .filter((id): id is string => id !== null)
      targetUserIds = [...targetUserIds, ...studentUserIds]
    }

    // Dedupe
    targetUserIds = [...new Set(targetUserIds)]

    // Update total count
    await db.notificationBatch.update({
      where: { id: batchId },
      data: { totalCount: targetUserIds.length },
    })

    // Create notifications in batches of 100
    const BATCH_SIZE = 100
    for (let i = 0; i < targetUserIds.length; i += BATCH_SIZE) {
      const chunk = targetUserIds.slice(i, i + BATCH_SIZE)

      await db.notification.createMany({
        data: chunk.map((userId) => ({
          schoolId,
          userId,
          type: batch.type,
          priority: "normal",
          title: batch.title,
          body: batch.body,
          actorId: createdById,
          channels: ["in_app", "email"],
        })),
      })

      created += chunk.length

      // Update sent count
      await db.notificationBatch.update({
        where: { id: batchId },
        data: { sentCount: created },
      })
    }

    // Mark batch as completed
    await db.notificationBatch.update({
      where: { id: batchId },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    })

    return { success: true, created, errors }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    errors.push(errorMessage)

    await db.notificationBatch.update({
      where: { id: batchId },
      data: {
        status: "failed",
        failedCount: 1,
        errors: [errorMessage],
      },
    })

    return { success: false, created, errors }
  }
}
