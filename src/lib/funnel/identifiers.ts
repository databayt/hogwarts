// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Identifier normalization for the funnel — the ONE implementation.
 *
 * Consumed by the chatbot capture (`components/chatbot/capture.ts`), the
 * inbox applier (`lib/funnel/apply-inbox.ts`), and the funnel scripts
 * (`scripts/funnel/lib.ts` re-exports these). The lane drifted twice when the
 * same rules lived in two files; it does not get a third chance.
 *
 * Pure functions only — no db, no env, importable from anywhere.
 */

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits → ASCII. A naive
 * regex silently drops every phone number typed the way Sudanese (and Gulf)
 * users actually type them. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

const CC: Record<string, string> = {
  SD: "249",
  EG: "20",
  SA: "966",
  AE: "971",
  QA: "974",
}

/**
 * Best-effort E.164 for the markets the funnel works. Returns null rather
 * than guess — a wrong number in a WhatsApp campaign is worse than none.
 *
 *   "+249 91 230 3865"      → +249912303865
 *   "00966557411272"        → +966557411272
 *   "0912303865" (country?) → +249912303865  (explicit country, or the SD/SA
 *                             local-mobile heuristics when none is given)
 */
export function toE164(
  raw: string | null | undefined,
  country?: string | null
): string | null {
  if (!raw) return null
  let n = normalizeDigits(raw).replace(/[^\d+]/g, "")
  if (!n) return null
  if (n.startsWith("00")) n = `+${n.slice(2)}`
  if (!n.startsWith("+")) {
    const cc = CC[(country ?? "").toUpperCase()]
    if (n.startsWith("0") && cc) n = `+${cc}${n.slice(1)}`
    else if (cc && n.length >= 8 && n.length <= 10) n = `+${cc}${n}`
    else if (/^(249|20|966|971|974)\d{7,}$/.test(n)) n = `+${n}`
    else if (/^09\d{8}$/.test(n)) n = `+249${n.slice(1)}` // Sudanese local mobile form
    else if (/^05\d{8}$/.test(n)) n = `+966${n.slice(1)}` // Saudi local mobile form
    else return null
  }
  return n.length >= 11 && n.length <= 16 ? n : null
}

const EMAIL_STRICT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EMAIL_SCAN_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
// 8+ digits with optional +/00 lead and common separators — then validated.
const PHONE_SCAN_RE = /(?:\+|00)?[\d][\d\s\-().]{7,18}\d/

/** Validate a whole string as an email (for stored fields). */
export const emailOf = (raw: string | null | undefined): string | null => {
  const v = (raw ?? "").trim().toLowerCase()
  return EMAIL_STRICT_RE.test(v) ? v : null
}

export interface FoundIdentifiers {
  email: string | null
  phone: string | null
}

/** Scan free text for a self-given email / phone. Deterministic, zero tokens. */
export function extractIdentifiers(text: string): FoundIdentifiers {
  const normalized = normalizeDigits(text)
  const email = normalized.match(EMAIL_SCAN_RE)?.[0]?.toLowerCase() ?? null
  let phone: string | null = null
  const m = normalized.match(PHONE_SCAN_RE)
  if (m) phone = toE164(m[0])
  return { email, phone }
}
