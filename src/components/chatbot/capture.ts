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
 * A chat reply is a reply: a cold row moves to `replied`. A row already
 * past that (replied, promoted, dead) keeps its status — a promoted lead who
 * chats again is still promoted.
 */
const COLD = new Set(["new", "enriched", "queued", "contacted"])

/** Room for many chat notes without letting one lead's row grow forever. */
const NOTES_MAX = 8000

/** Append a dated chat note; past the cap, keep the oldest and newest text. */
function appendNote(prev: string | null, note: string): string {
  const next = prev ? `${prev}\n${note}` : note
  if (next.length <= NOTES_MAX) return next
  return `${next.slice(0, 2000)}\n…\n${next.slice(-(NOTES_MAX - 2004))}`
}

/**
 * Upsert the Prospect for identifiers a visitor typed into the chat. Returns
 * the prospect's id, or null when nothing was captured.
 * Never throws — the reply must go out whether or not capture lands.
 *
 * Reads the NEWEST user message only. Every message is captured as it is
 * sent, so earlier turns were already seen — and the history a client sends
 * is the client's word, not the visitor's.
 *
 * One lead, one row, fill-empty-never-replace-populated: the row is found by
 * either identifier (its inbound key or its email/phone column — a scraped
 * school that chats is the same lead), the oldest match wins, empty contact
 * fields are filled, the conversation is appended to `notes`, and nothing a
 * human or the funnel set is overwritten.
 */
export async function captureFromChat(args: {
  messages: Array<{ role: string; content: unknown }>
  locale: string
}): Promise<string | null> {
  try {
    const userTurns = args.messages
      .filter((m) => m.role === "user" && typeof m.content === "string")
      .map((m) => m.content as string)
    const latest = userTurns.at(-1)
    if (!latest) return null

    const { email, phone } = extractIdentifiers(latest)
    if (!email && !phone) return null

    const keys = [
      ...(email ? [`inbound:${email}`] : []),
      ...(phone ? [`inbound:wa:${phone}`] : []),
    ]
    // The last few turns are the context a human needs to reply well.
    const tail = userTurns.slice(-4).join(" · ").slice(0, 600)
    const note = `chatbot (${args.locale}, ${new Date().toISOString().slice(0, 10)}): ${tail}`
    const find = () =>
      db.prospect.findFirst({
        where: {
          OR: [
            { gmapsPlaceId: { in: keys } },
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
        orderBy: { scrapedAt: "asc" },
        select: { id: true, email: true, phone: true, status: true, notes: true },
      })

    const touch = async (row: NonNullable<Awaited<ReturnType<typeof find>>>) => {
      await db.prospect.update({
        where: { id: row.id },
        data: {
          ...(email && !row.email ? { email } : {}),
          ...(phone && !row.phone ? { phone } : {}),
          ...(COLD.has(row.status) ? { status: "replied" } : {}),
          lastTouchAt: new Date(),
          notes: appendNote(row.notes, note),
        },
      })
      return row.id
    }

    const existing = await find()
    if (existing) return await touch(existing)

    let created: { id: string }
    try {
      created = await db.prospect.create({
        data: {
          gmapsPlaceId: keys[0]!,
          name: email ?? phone!,
          email,
          phone,
          country: "unknown",
          source: "chatbot",
          status: "replied", // self-identified — straight to the reply-SLA bucket
          tags: ["chatbot", `locale:${args.locale}`],
          notes: note,
          lastTouchAt: new Date(),
        },
        select: { id: true },
      })
    } catch (err) {
      // Two messages raced to create the same lead: the other one won, so
      // this one is an update — and the alert was the winner's to send.
      if ((err as { code?: string }).code !== "P2002") throw err
      const winner = await find()
      return winner ? await touch(winner) : null
    }

    // A captured lead nobody hears about is a lead silently lost — the reply
    // SLA starts now, not when someone happens to open the CRM. Notify
    // exactly once, when the row is genuinely new. Isolated in its own
    // try/catch: a mail failure must not fail the capture.
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
    return created.id
  } catch (err) {
    // Capture must never block a reply. Log and move on.
    console.error("[chatbot] capture failed", err)
    return null
  }
}
