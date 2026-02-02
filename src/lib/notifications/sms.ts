/**
 * SMS Notification Service
 *
 * Provides SMS notification capabilities using Twilio.
 * Used for critical notifications like absence alerts, emergency messages, etc.
 *
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Twilio phone number for sending SMS
 * - SMS_ENABLED: Set to "true" to enable SMS sending (optional, defaults to false)
 *
 * Usage:
 * ```ts
 * import { sendSMS, sendBulkSMS } from "@/lib/notifications/sms"
 *
 * // Send single SMS
 * await sendSMS({
 *   to: "+1234567890",
 *   message: "Your child was marked absent today."
 * })
 *
 * // Send bulk SMS
 * await sendBulkSMS([
 *   { to: "+1234567890", message: "Message 1" },
 *   { to: "+0987654321", message: "Message 2" }
 * ])
 * ```
 */

import { Twilio } from "twilio"

// Initialize Twilio client (lazy initialization)
let twilioClient: Twilio | null = null

function getTwilioClient(): Twilio | null {
  if (twilioClient) return twilioClient

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.warn("[SMS] Twilio credentials not configured")
    return null
  }

  twilioClient = new Twilio(accountSid, authToken)
  return twilioClient
}

// Check if SMS is enabled
function isSMSEnabled(): boolean {
  return process.env.SMS_ENABLED === "true"
}

// SMS Result type
export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

// SMS Options
export interface SMSOptions {
  to: string // Phone number in E.164 format (+1234567890)
  message: string
  mediaUrl?: string // Optional MMS media URL
}

/**
 * Validate phone number format (E.164)
 */
function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

/**
 * Normalize phone number to E.164 format
 * This is a basic implementation - consider using libphonenumber for production
 */
export function normalizePhoneNumber(
  phone: string,
  defaultCountryCode: string = "+966" // Saudi Arabia default
): string | null {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "")

  // If starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2)
  }

  // If doesn't start with +, add default country code
  if (!cleaned.startsWith("+")) {
    // Remove leading 0 if present (common in local numbers)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1)
    }
    cleaned = defaultCountryCode + cleaned
  }

  return isValidPhoneNumber(cleaned) ? cleaned : null
}

/**
 * Send a single SMS message
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  // Check if SMS is enabled
  if (!isSMSEnabled()) {
    console.log(
      "[SMS] SMS is disabled. Would have sent:",
      options.message,
      "to",
      options.to
    )
    return {
      success: true,
      messageId: "disabled-mode",
    }
  }

  // Validate phone number
  if (!isValidPhoneNumber(options.to)) {
    return {
      success: false,
      error: `Invalid phone number format: ${options.to}. Must be E.164 format.`,
    }
  }

  // Get Twilio client
  const client = getTwilioClient()
  if (!client) {
    return {
      success: false,
      error: "Twilio client not configured",
    }
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) {
    return {
      success: false,
      error: "TWILIO_PHONE_NUMBER not configured",
    }
  }

  try {
    const messageParams: {
      body: string
      from: string
      to: string
      mediaUrl?: string[]
    } = {
      body: options.message,
      from: fromNumber,
      to: options.to,
    }

    if (options.mediaUrl) {
      messageParams.mediaUrl = [options.mediaUrl]
    }

    const message = await client.messages.create(messageParams)

    console.log("[SMS] Message sent:", message.sid, "to", options.to)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error("[SMS] Error sending message:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Send bulk SMS messages
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function sendBulkSMS(messages: SMSOptions[]): Promise<{
  results: SMSResult[]
  summary: { sent: number; failed: number }
}> {
  const results = await Promise.allSettled(messages.map((msg) => sendSMS(msg)))

  const processedResults: SMSResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    }
    return {
      success: false,
      error: result.reason?.message || "Unknown error",
    }
  })

  const sent = processedResults.filter((r) => r.success).length
  const failed = processedResults.filter((r) => !r.success).length

  console.log(`[SMS] Bulk send complete: ${sent} sent, ${failed} failed`)

  return {
    results: processedResults,
    summary: { sent, failed },
  }
}

// ============================================================================
// ATTENDANCE-SPECIFIC SMS TEMPLATES
// ============================================================================

export interface AttendanceSMSParams {
  studentName: string
  className: string
  date: string
  status: "ABSENT" | "LATE"
  schoolName?: string
}

/**
 * Generate absence notification SMS in English
 */
export function generateAbsenceSMSEn(params: AttendanceSMSParams): string {
  const status = params.status === "ABSENT" ? "absent" : "late"
  return `${params.schoolName || "School"} Alert: ${params.studentName} was marked ${status} from ${params.className} on ${params.date}. If unexpected, please contact the school.`
}

/**
 * Generate absence notification SMS in Arabic
 */
export function generateAbsenceSMSAr(params: AttendanceSMSParams): string {
  const status = params.status === "ABSENT" ? "غائباً" : "متأخراً"
  return `تنبيه ${params.schoolName || "المدرسة"}: تم تسجيل ${params.studentName} ${status} من ${params.className} في ${params.date}. إذا كان هذا غير متوقع، يرجى التواصل مع المدرسة.`
}

/**
 * Send attendance notification SMS to guardian
 */
export async function sendAttendanceSMS(
  phone: string,
  params: AttendanceSMSParams,
  locale: "en" | "ar" = "en"
): Promise<SMSResult> {
  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone) {
    return {
      success: false,
      error: `Invalid phone number: ${phone}`,
    }
  }

  const message =
    locale === "ar"
      ? generateAbsenceSMSAr(params)
      : generateAbsenceSMSEn(params)

  return sendSMS({
    to: normalizedPhone,
    message,
  })
}

// ============================================================================
// NOTIFICATION CHANNEL INTEGRATION
// ============================================================================

export type NotificationChannel = "in_app" | "email" | "sms" | "push"

/**
 * Check if a notification channel is available
 */
export function isChannelAvailable(channel: NotificationChannel): boolean {
  switch (channel) {
    case "sms":
      return isSMSEnabled() && !!process.env.TWILIO_ACCOUNT_SID
    case "email":
      // Email is typically always available
      return true
    case "in_app":
      // In-app is always available
      return true
    case "push":
      // Push notifications may require additional setup
      return !!process.env.PUSH_NOTIFICATION_KEY
    default:
      return false
  }
}

/**
 * Get available notification channels
 */
export function getAvailableChannels(): NotificationChannel[] {
  const channels: NotificationChannel[] = ["in_app", "email"]

  if (isChannelAvailable("sms")) {
    channels.push("sms")
  }

  if (isChannelAvailable("push")) {
    channels.push("push")
  }

  return channels
}
