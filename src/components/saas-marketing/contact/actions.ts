// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { headers } from "next/headers"

import { sendEmail } from "@/lib/email"

import { contactServerSchema } from "./validation"

export type ContactErrorCode =
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "SEND_FAILED"

export type ContactResult =
  | { success: true }
  | { success: false; errorCode: ContactErrorCode }

const RECIPIENT = "hi@databayt.org"
const RATE_LIMIT_PREFIX = "saas_marketing_contact"
const MAX_REQUESTS_PER_HOUR = 3

/**
 * Best-effort IP rate-limit. Lazy-imports the Upstash limiter so the
 * marketing form keeps working in environments without Redis configured
 * (local dev, preview deploys without secrets).
 *
 * Returns `true` when the request is allowed, `false` when limited.
 */
async function isAllowedByRateLimit(ip: string): Promise<boolean> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // No Redis configured — fail open. Honeypot still in place.
    return true
  }

  try {
    const { createCustomRateLimiter } =
      await import("@/components/file/rate-limit")
    const limiter = createCustomRateLimiter({
      maxRequests: MAX_REQUESTS_PER_HOUR,
      windowSeconds: 3600,
      prefix: RATE_LIMIT_PREFIX,
    })
    const { success } = await limiter.limit(ip)
    return success
  } catch (err) {
    console.error("[saas-marketing/contact] rate-limit unavailable:", err)
    return true
  }
}

/**
 * Submit the "Let's Work Together" contact form.
 *
 * Best-practice posture:
 * - Server-side Zod validation (never trust client)
 * - Honeypot field returns silent success so bots can't probe
 * - Per-IP sliding-window rate limit (3/hour) when Upstash is available
 * - Returns `errorCode` (per .claude/rules/translation.md) — client maps to i18n
 * - Email send wrapped in try/catch; failures never crash the marketing page
 */
export async function submitContact(input: unknown): Promise<ContactResult> {
  const parsed = contactServerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, errorCode: "VALIDATION_FAILED" }
  }

  // Silent success on honeypot trip — don't tip off bots.
  if (parsed.data.website) {
    return { success: true }
  }

  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"

  const allowed = await isAllowedByRateLimit(ip)
  if (!allowed) {
    return { success: false, errorCode: "RATE_LIMITED" }
  }

  try {
    await sendEmail({
      to: RECIPIENT,
      subject: `[Lead] ${parsed.data.email}`,
      template: "contact-form",
      // sendEmail's generateEmailHtml only renders `data.message` — embed
      // the visitor's email + locale inside that one rendered block.
      data: {
        message: `From: ${parsed.data.email}\nLang: ${parsed.data.lang}\n\n${parsed.data.message}`,
      },
    })
    return { success: true }
  } catch (err) {
    console.error("[saas-marketing/contact] sendEmail failed:", err)
    return { success: false, errorCode: "SEND_FAILED" }
  }
}
