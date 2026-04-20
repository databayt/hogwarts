// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Resend } from "resend"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, reactHTML: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Invoice <onboarding@resend.dev>",
      to: to,
      subject: subject,
      react: reactHTML,
    })

    if (error) {
      console.error("Error sending email:", error)
      return actionError(ACTION_ERRORS.EMAIL_SEND_FAILED, error.message)
    }

    return { success: true as const, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    return actionError(
      ACTION_ERRORS.EMAIL_SEND_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
