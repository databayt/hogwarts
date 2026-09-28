/**
 * Waves — the pure half of the outreach learning loop (no fs, no network).
 *
 * A WAVE is one deliberate batch of first messages (`tick --wave=w1`). Each
 * school in it gets one opening-message VARIANT, and the wave ledger
 * (`scripts/crm/.data/waves/<wave>.json`, gitignored — it holds school
 * contacts and reply texts, and this repo is public) records what happened
 * to every message afterwards. The learner reads the ledgers; the next wave
 * reads the learner. Nothing here sends anything.
 *
 * Allocation is deliberately boring: with one active variant per lane every
 * school gets it; with more, ~80% get the incumbent (the best reply rate once
 * it has MIN_SAMPLE sends, else the oldest) and ~20% a challenger. The split
 * is a hash of the company id, so re-running a dry plan picks the same
 * variant for the same school.
 */

export type Lane = "whatsapp" | "email"

export interface Variant {
  id: string
  lane: Lane
  lang: "ar" | "en"
  active: boolean
  parent: string | null
  createdAt: string
  hypothesis?: string
  /** Email only. May contain {school}. */
  subject?: string
  /** One array entry per line. Placeholders: {school}, {deck}. */
  body: string[]
}

export type EventKind =
  | "delivered"
  | "bounced"
  | "complained"
  | "replied"
  | "auto_reply"
  | "opted_out"

export interface LedgerEvent {
  at: string
  kind: EventKind
  note?: string
}

export interface LedgerRow {
  companyId: string
  name: string
  lane: Lane
  seg: string
  to: string
  variant: string
  /** whatsapp: when the card was queued (a human sends); email: when Resend accepted it. */
  at: string
  status: "sent" | "queued" | "failed"
  resendId?: string
  events: LedgerEvent[]
}

export interface WaveLedger {
  wave: string
  createdAt: string
  rows: LedgerRow[]
}

export interface VariantStats {
  sent: number
  delivered: number
  bounced: number
  replied: number
  optedOut: number
}

export const MIN_SAMPLE = 10
export const CHALLENGER_SHARE = 0.2

export function renderVariant(
  v: Variant,
  ctx: { school: string; deck: string }
): { subject?: string; text: string } {
  const fill = (s: string) =>
    s.replaceAll("{school}", ctx.school).replaceAll("{deck}", ctx.deck)
  return {
    subject: v.subject ? fill(v.subject) : undefined,
    text: v.body.map(fill).join("\n"),
  }
}

const has = (r: LedgerRow, k: EventKind) => r.events.some((e) => e.kind === k)

/** Per-variant counts across every ledger. A failed send is not a send. */
export function variantStats(ledgers: WaveLedger[]): Map<string, VariantStats> {
  const out = new Map<string, VariantStats>()
  for (const l of ledgers)
    for (const r of l.rows) {
      if (r.status === "failed") continue
      const s = out.get(r.variant) ?? {
        sent: 0,
        delivered: 0,
        bounced: 0,
        replied: 0,
        optedOut: 0,
      }
      s.sent++
      if (has(r, "delivered")) s.delivered++
      if (has(r, "bounced")) s.bounced++
      if (has(r, "replied")) s.replied++
      if (has(r, "opted_out")) s.optedOut++
      out.set(r.variant, s)
    }
  return out
}

/** Replies over messages that could have been read (bounces excluded). */
export function replyRate(s: VariantStats | undefined): number {
  if (!s) return 0
  const reached = s.sent - s.bounced
  return reached > 0 ? s.replied / reached : 0
}

/** Stable 0–99 bucket for a string (FNV-1a). */
export function bucket(key: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) % 100
}

/** The incumbent: best reply rate among variants with MIN_SAMPLE sends, else the oldest. */
export function incumbentOf(
  candidates: Variant[],
  stats: Map<string, VariantStats>
): Variant {
  const proven = candidates.filter(
    (v) => (stats.get(v.id)?.sent ?? 0) >= MIN_SAMPLE
  )
  if (proven.length)
    return [...proven].sort(
      (a, b) => replyRate(stats.get(b.id)) - replyRate(stats.get(a.id))
    )[0]
  return [...candidates].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )[0]
}

export function chooseVariant(
  companyId: string,
  lane: Lane,
  variants: Variant[],
  stats: Map<string, VariantStats>,
  lang: "ar" | "en" = "ar"
): Variant {
  let candidates = variants.filter(
    (v) => v.active && v.lane === lane && v.lang === lang
  )
  if (!candidates.length)
    candidates = variants.filter((v) => v.active && v.lane === lane)
  if (!candidates.length)
    throw new Error(`no active variant for lane ${lane} — nothing to send`)
  if (candidates.length === 1) return candidates[0]
  const incumbent = incumbentOf(candidates, stats)
  const challengers = candidates.filter((v) => v.id !== incumbent.id)
  const b = bucket(companyId)
  if (b >= CHALLENGER_SHARE * 100) return incumbent
  return challengers[b % challengers.length]
}

const ARABIC = /[؀-ۿ]/
/** Latin letters spelling Arabic words: an Arabic-medium school, not a British one. */
const TRANSLIT =
  /\b(al|el|ahl\w*|ahsl\w*|madaris|madrasa\w*|madrasat|dar|nahda|manarat|rawdat?|riyadh?)\b|^al-/i
const INTERNATIONAL =
  /\b(international|american|british|english|canadian|australian|college|academy|IB)\b|\bschool of\b/i

/**
 * Which language the opener goes out in. An American school in Doha that
 * receives an Arabic cold email reads it as misaddressed; a Sudanese private
 * school that receives English reads it as foreign. So: rail `other` → en;
 * an Arabic-script name → ar; a Latin-script name that says it is
 * international/American/British/a college/an academy → en; a Latin-script
 * name in the Gulf → en unless it transliterates Arabic (Ahliyya, Al-,
 * Madaris…) — the dry run sent Arabic to St. Christopher's Bahrain; else ar.
 * A heuristic, and the ledger records the variant, so the learner can say
 * whether the guess cost replies.
 */
export function langFor(name: string, rail: string): "ar" | "en" {
  if (rail === "other") return "en"
  if (ARABIC.test(name)) return "ar"
  if (INTERNATIONAL.test(name)) return "en"
  return rail === "gulf" && !TRANSLIT.test(name) ? "en" : "ar"
}
