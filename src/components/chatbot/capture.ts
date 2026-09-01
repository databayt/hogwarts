// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Chatbot capture — the deterministic half of the conversion funnel.
 *
 * The bot answered well and persisted nothing: every identifier a school owner
 * typed into the widget evaporated with the tab. This module is the fix, and
 * it is deliberately NOT the LLM's job: capture is a parallel deterministic
 * pass over the user's own words, so a capture failure can never block a
 * reply, and a model reply can never fabricate a contact.
 *
 * Scope guard: capture runs ONLY in `saasMarketing` mode — a school owner
 * evaluating Databayt. `schoolSite` visitors are a tenant school's prospective
 * parents; they are the school's audience, not Databayt's sales pipeline, and
 * they do not belong in our CRM.
 *
 * Identity keys mirror the inbound-form discipline in
 * `saas-marketing/actions.ts`: `inbound:<email>` / `inbound:wa:<e164>` on
 * `Prospect.gmapsPlaceId`, fill-empty-never-replace-populated, so a lead that
 * starts in the widget and later lands on a form (or vice versa) stays ONE row.
 */
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { extractIdentifiers } from "@/lib/funnel/identifiers"

// Same target as the saas-marketing form notifier. The fallback only counts if
// someone actually reads that box — set SALES_NOTIFY_EMAIL to a monitored
// mailbox in prod. Trimmed: Vercel-pulled env values carry stray newlines.
const SALES_INBOX = (process.env.SALES_NOTIFY_EMAIL ?? "hi@databayt.org").trim()

// Re-exported so the unit tests and any existing consumers keep one import path.
export {
  extractIdentifiers,
  normalizeDigits,
  toE164,
} from "@/lib/funnel/identifiers"

/**
 * Upsert the Prospect for identifiers a visitor typed into the chat.
 * Never throws — the reply must go out whether or not capture lands.
 */
export async function captureFromChat(args: {
  messages: Array<{ role: string; content: unknown }>
  locale: string
}): Promise<void> {
  try {
    const userTurns = args.messages
      .filter((m) => m.role === "user" && typeof m.content === "string")
      .map((m) => m.content as string)
    if (!userTurns.length) return

    // Scan every user turn — the phone often arrives turns after the question.
    let email: string | null = null
    let phone: string | null = null
    for (const t of userTurns) {
      const found = extractIdentifiers(t)
      email ||= found.email
      phone ||= found.phone
    }
    if (!email && !phone) return

    const key = email ? `inbound:${email}` : `inbound:wa:${phone}`
    // The last few turns are the context a human needs to reply well.
    const tail = userTurns.slice(-4).join(" · ").slice(0, 600)

    // Create-only alert dedup: every later message in the same conversation
    // re-runs this scan and re-upserts the same row, so without this check the
    // founder gets one email per chat turn from the same lead — and stops
    // reading them. Notify exactly once, when the row is genuinely new.
    const existing = await db.prospect.findUnique({
      where: { gmapsPlaceId: key },
      select: { id: true },
    })

    await db.prospect.upsert({
      where: { gmapsPlaceId: key },
      create: {
        gmapsPlaceId: key,
        name: email ?? phone!,
        email,
        phone,
        country: "unknown",
        source: "chatbot",
        status: "replied", // self-identified — straight to the reply-SLA bucket
        tags: ["chatbot", `locale:${args.locale}`],
        notes: `chatbot (${args.locale}): ${tail}`,
        lastTouchAt: new Date(),
      },
      update: {
        // add what this conversation gave us (same discipline as the inbound forms)
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        status: "replied",
        lastTouchAt: new Date(),
        notes: `chatbot (${args.locale}): ${tail}`,
      },
    })

    // A captured lead nobody hears about is a lead silently lost — the reply
    // SLA starts now, not when someone happens to open the CRM. Isolated in
    // its own try/catch: a mail failure must not fail the capture.
    if (!existing) {
      try {
        await sendEmail({
          to: SALES_INBOX,
          subject: `🔥 chatbot lead: ${email ?? phone}`,
          template: "sales-notify",
          data: {
            source: "chatbot",
            locale: args.locale,
            email: email ?? "—",
            phone: phone ?? "—",
            context: tail,
          },
        })
      } catch (err) {
        console.error("[chatbot] capture alert failed", err)
      }
    }
  } catch (err) {
    // Capture must never block a reply. Log and move on.
    console.error("[chatbot] capture failed", err)
  }
}
