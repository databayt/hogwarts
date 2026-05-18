// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Outreach sender for the 5-touch cadence.
 *
 * - Renders React Email templates via Resend's native React support.
 * - Updates the matching Prospect row with status, lastTouchAt, lastTouchNumber.
 * - Use this for cold/warm outreach to Prospect rows. For tenant-bound Leads,
 *   keep using the operator console workflow (which writes LeadActivity).
 */

import { Resend } from "resend"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"
import OutreachTouch1 from "@/components/saas-marketing/pricing/emails/outreach-touch-1"
import OutreachTouch2 from "@/components/saas-marketing/pricing/emails/outreach-touch-2"
import OutreachTouch3 from "@/components/saas-marketing/pricing/emails/outreach-touch-3"
import OutreachTouch4 from "@/components/saas-marketing/pricing/emails/outreach-touch-4"
import OutreachTouch5 from "@/components/saas-marketing/pricing/emails/outreach-touch-5"

const resend = new Resend(env.RESEND_API_KEY)

const OUTREACH_FROM =
  process.env.OUTREACH_FROM_EMAIL ?? "Ali at Databayt <ali@databayt.org>"
const OUTREACH_SENDER_NAME = process.env.OUTREACH_SENDER_NAME ?? "Ali"
const OUTREACH_SENDER_EMAIL =
  process.env.OUTREACH_SENDER_EMAIL ?? "ali@databayt.org"
const CAL_LINK =
  process.env.OUTREACH_CAL_LINK ?? "https://cal.com/databayt/demo"
const CASE_STUDY_URL =
  process.env.OUTREACH_CASE_STUDY_URL ??
  "https://ed.databayt.org/en/case-studies/king-fahad"
const LOOM_URL = process.env.OUTREACH_LOOM_URL || null

export type TouchNumber = 1 | 2 | 3 | 4 | 5
export type OutreachSendResult =
  | { success: true; prospectId: string; touch: TouchNumber; resendId?: string }
  | { success: false; prospectId: string; touch: TouchNumber; reason: string }

function pickLang(prospectLang: string | null | undefined): "ar" | "en" {
  // ar | bilingual | fr | null → default to Arabic (founder ICP)
  return prospectLang === "en" ? "en" : "ar"
}

function subjectFor(args: {
  touch: TouchNumber
  lang: "ar" | "en"
  principal?: string | null
  school: string
}): string {
  const ar = args.lang === "ar"
  switch (args.touch) {
    case 1: {
      if (ar) {
        const honorific = args.principal?.trim() || "حضرة المدير"
        return `${honorific}، سؤال واحد عن ${args.school}`
      }
      return `One question about ${args.school}`
    }
    case 2:
      // Reply-bump stays in the Touch 1 thread; same subject + "Re:"
      if (ar) {
        const honorific = args.principal?.trim() || "حضرة المدير"
        return `Re: ${honorific}، سؤال واحد عن ${args.school}`
      }
      return `Re: One question about ${args.school}`
    case 3:
      return ar
        ? `قصة من مدرسة الملك فهد`
        : `How King Fahad Schools cut admin overhead`
    case 4:
      return ar ? `هل أحجز لكم عرضاً ١٥ دقيقة؟` : `15-min demo this week?`
    case 5:
      return ar ? `هل أغلق الملف؟` : `Closing the loop on ${args.school}`
  }
}

function renderTouch(args: {
  touch: TouchNumber
  lang: "ar" | "en"
  prospect: {
    name: string
    country: string
    city: string | null
    principalName: string | null
    gmapsRating: number | null
  }
}) {
  const common = {
    lang: args.lang,
    school: args.prospect.name,
    city: args.prospect.city,
    senderName: OUTREACH_SENDER_NAME,
    senderEmail: OUTREACH_SENDER_EMAIL,
  }
  switch (args.touch) {
    case 1:
      return OutreachTouch1({
        ...common,
        principal: args.prospect.principalName,
        country: args.prospect.country,
        rating: args.prospect.gmapsRating,
        calLink: CAL_LINK,
      })
    case 2:
      return OutreachTouch2({
        ...common,
        country: args.prospect.country,
      })
    case 3:
      return OutreachTouch3({
        ...common,
        caseStudyUrl: CASE_STUDY_URL,
        loomUrl: LOOM_URL,
      })
    case 4:
      return OutreachTouch4({
        ...common,
        calLink: CAL_LINK,
      })
    case 5:
      return OutreachTouch5({ ...common })
  }
}

/**
 * Send a specific touch (1-5) to a Prospect.
 * - Skips if no email on file.
 * - Updates status to "contacted" (after Touch 1) or keeps existing if later
 *   touches; bumps lastTouchAt + lastTouchNumber regardless.
 * - Idempotent at the (prospectId, touch) level: caller decides re-send.
 */
export async function sendOutreachTouch(
  prospectId: string,
  touch: TouchNumber,
  opts?: { dryRun?: boolean }
): Promise<OutreachSendResult> {
  const prospect = await db.prospect.findUnique({
    where: { id: prospectId },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      country: true,
      principalName: true,
      gmapsRating: true,
      language: true,
      status: true,
    },
  })

  if (!prospect) {
    return { success: false, prospectId, touch, reason: "Prospect not found" }
  }
  if (!prospect.email) {
    return { success: false, prospectId, touch, reason: "No email on file" }
  }

  const lang = pickLang(prospect.language)
  const subject = subjectFor({
    touch,
    lang,
    principal: prospect.principalName,
    school: prospect.name,
  })

  if (opts?.dryRun) {
    return { success: true, prospectId, touch }
  }

  const recipient =
    process.env.NODE_ENV === "development"
      ? "delivered@resend.dev"
      : prospect.email

  try {
    const result = await resend.emails.send({
      from: OUTREACH_FROM,
      to: recipient,
      subject,
      react: renderTouch({ touch, lang, prospect }),
      headers: {
        "X-Entity-Ref-ID": `prospect:${prospect.id}:touch${touch}`,
      },
    })

    if (result.error) {
      return {
        success: false,
        prospectId,
        touch,
        reason: result.error.message,
      }
    }

    await db.prospect.update({
      where: { id: prospect.id },
      data: {
        status: prospect.status === "new" ? "contacted" : prospect.status,
        lastTouchAt: new Date(),
        lastTouchNumber: touch,
      },
    })

    return {
      success: true,
      prospectId,
      touch,
      resendId: result.data?.id,
    }
  } catch (err) {
    return {
      success: false,
      prospectId,
      touch,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Backwards-compat alias used by scripts/send-touch-1.ts.
 */
export async function sendOutreachTouch1(
  prospectId: string,
  opts?: { dryRun?: boolean }
) {
  const result = await sendOutreachTouch(prospectId, 1, opts)
  // Preserve the previous shape (no `touch` field) for the older CLI.
  return result.success
    ? { success: true as const, prospectId, resendId: result.resendId }
    : { success: false as const, prospectId, reason: result.reason }
}
