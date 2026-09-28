/**
 * The outreach queue — every reachable, never-messaged school, segmented.
 * Shared by tick.ts (the send) and next-wave.ts (the plan), so the plan can
 * never describe a queue the send would not see.
 */
import { langFor } from "@/lib/funnel/waves"

import { emailOf, isMobile, railOf, toE164 } from "./lib"

export interface Company {
  id: string
  name?: string | null
  stage?: string | null
  tier?: string | null
  country?: string | null
  schoolPhone?: string | null
  principalContact?: string | null
  outreachStatus?: string | null
}

export interface QueueRow {
  id: string
  name: string
  tier: string
  seg: string
  lane: "whatsapp" | "email"
  to: string // e164 or email
  lang: "ar" | "en"
}

export const globToRe = (g: string) =>
  new RegExp(
    `^(${g
      .split(",")
      .map((p) =>
        p.trim().replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")
      )
      .join("|")})$`,
    "i"
  )

/**
 * A name that is scraped debris, not a school's name — it is pasted into the
 * opening line ("أكتب لكم بخصوص {school}"), so a Facebook snippet there reads
 * as a bot. Held back for a human to rename, never sent.
 */
export function isJunkName(name: string): boolean {
  return (
    name.length > 90 ||
    /facebook|https?:|www\.|·|‼|[٠-٩0-9]{1,2}[/‏]+[٠-٩0-9]{1,2}[/‏]+[٠-٩0-9]{2,4}/i.test(name)
  )
}

export function buildQueue(rows: Company[]): QueueRow[] {
  const q: QueueRow[] = []
  // One recipient, one message. Branches of one school share a switchboard
  // or an admissions inbox (measured 2026-09-28: 11 duplicate sends across 10
  // recipients, one number listed on three sections of one complex), and a
  // recipient already messaged under another row must not get a second opener.
  const contacted = new Set<string>()
  for (const c of rows) {
    const stage = (c.stage ?? "").toUpperCase()
    const outreach = (c.outreachStatus ?? "NOT_STARTED").toUpperCase()
    const eligible =
      (stage === "COLD" || stage === "PROSPECT") && outreach === "NOT_STARTED"
    if (!eligible) {
      const e164 = toE164(c.schoolPhone, c.country)
      if (e164) contacted.add(e164)
      const email = emailOf(c.principalContact)
      if (email) contacted.add(email.toLowerCase())
      continue
    }
    const e164 = toE164(c.schoolPhone, c.country)
    const mobile = e164 && isMobile(e164) ? e164 : null
    const email = emailOf(c.principalContact)
    if (!mobile && !email) continue
    if (isJunkName(c.name ?? "")) continue
    const rail = railOf(c.country, e164)
    const tier = (c.tier ?? "C").toUpperCase()
    const seg = `${rail}-${tier}` // v1 key — bands join once student counts exist
    q.push({
      id: c.id,
      name: c.name ?? "(unnamed)",
      tier,
      seg,
      lane: mobile ? "whatsapp" : "email",
      to: mobile ?? email!,
      lang: langFor(c.name ?? "", rail),
    })
  }
  // Tier A first, then B; sd rail leads inside a tier (WhatsApp-first market).
  // Among equals the shorter name wins the recipient: "Doha College" over
  // "Doha College West Bay" — the umbrella name suits a shared inbox.
  const rank = (r: QueueRow) =>
    `${{ A: 0, B: 1 }[r.tier] ?? 2}-${r.seg.startsWith("sd") ? 0 : 1}`
  q.sort(
    (a, b) =>
      rank(a).localeCompare(rank(b)) || a.name.length - b.name.length
  )
  const seen = new Set(contacted)
  return q.filter((r) => {
    const k = r.to.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
