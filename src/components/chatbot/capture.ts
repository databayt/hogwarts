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

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits → ASCII. A naive
 * regex silently drops every phone number typed the way Sudanese (and Gulf)
 * users actually type them. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
// 8+ digits with optional +/00 lead and common separators — then validated.
const PHONE_RE = /(?:\+|00)?[\d][\d\s\-().]{7,18}\d/

/** Best-effort E.164 for the markets the funnel works (SD/EG/SA/AE/QA).
 * Returns null rather than guess — a wrong number is worse than none. */
export function toE164(raw: string): string | null {
  let n = normalizeDigits(raw).replace(/[^\d+]/g, "")
  if (n.startsWith("00")) n = `+${n.slice(2)}`
  if (!n.startsWith("+")) {
    if (/^(249|20|966|971|974)\d{7,}$/.test(n)) n = `+${n}`
    else if (/^09\d{8}$/.test(n)) n = `+249${n.slice(1)}` // Sudanese local mobile form
    else if (/^05\d{8}$/.test(n)) n = `+966${n.slice(1)}` // Saudi local mobile form
    else return null
  }
  return n.length >= 11 && n.length <= 16 ? n : null
}

export interface ChatIdentifiers {
  email: string | null
  phone: string | null
}

/** Scan free text for a self-given email / phone. Deterministic, zero tokens. */
export function extractIdentifiers(text: string): ChatIdentifiers {
  const normalized = normalizeDigits(text)
  const email = normalized.match(EMAIL_RE)?.[0]?.toLowerCase() ?? null
  let phone: string | null = null
  const m = normalized.match(PHONE_RE)
  if (m) phone = toE164(m[0])
  return { email, phone }
}

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
  } catch (err) {
    // Capture must never block a reply. Log and move on.
    console.error("[chatbot] capture failed", err)
  }
}
