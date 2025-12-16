import { Resend } from "resend"

import { env } from "@/env.mjs"

const resend = new Resend(env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
}

/**
 * Send an email using Resend
 * Supports different templates for various email types
 */
export async function sendEmail({ to, subject, data }: SendEmailParams) {
  const from = env.EMAIL_FROM ?? "School Portal <noreply@school.databayt.org>"

  // In development, use Resend's test recipient
  const recipient =
    process.env.NODE_ENV === "development" ? "delivered@resend.dev" : to

  try {
    const { data: responseData, error } = await resend.emails.send({
      from,
      to: recipient,
      subject,
      html: generateEmailHtml(subject, data),
      headers: {
        "X-Entity-Ref-ID": Date.now().toString(),
      },
    })

    if (error) {
      console.error("[Email] Resend error:", error)
      throw new Error(error.message)
    }

    return { success: true, id: responseData?.id }
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    throw error
  }
}

/**
 * Generate HTML for email based on data
 * Simple inline template - can be enhanced with React Email later
 */
function generateEmailHtml(
  subject: string,
  data: Record<string, unknown>
): string {
  const code = data.code as string
  const expiresIn = data.expiresIn as string

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f9fafb; border-radius: 8px; padding: 32px; text-align: center;">
          <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600;">
            ${subject}
          </h1>
          ${
            code
              ? `
          <p style="margin: 0 0 16px; color: #6b7280;">
            Your verification code is:
          </p>
          <div style="background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px 32px; display: inline-block; margin: 0 0 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">
              ${code}
            </span>
          </div>
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">
            This code expires in ${expiresIn || "15 minutes"}
          </p>
          `
              : ""
          }
        </div>
        <p style="margin: 24px 0 0; text-align: center; color: #9ca3af; font-size: 12px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </body>
    </html>
  `
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: "Verify your email - School Portal",
    template: "verification-code",
    data: {
      code,
      expiresIn: "15 minutes",
    },
  })
}
