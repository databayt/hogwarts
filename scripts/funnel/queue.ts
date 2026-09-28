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

export function buildQueue(rows: Company[]): QueueRow[] {
  const q: QueueRow[] = []
  for (const c of rows) {
    const stage = (c.stage ?? "").toUpperCase()
    if (stage !== "COLD" && stage !== "PROSPECT") continue
    const outreach = (c.outreachStatus ?? "NOT_STARTED").toUpperCase()
    if (outreach !== "NOT_STARTED") continue
    const e164 = toE164(c.schoolPhone, c.country)
    const mobile = e164 && isMobile(e164) ? e164 : null
    const email = emailOf(c.principalContact)
    if (!mobile && !email) continue
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
  const rank = (r: QueueRow) =>
    `${{ A: 0, B: 1 }[r.tier] ?? 2}-${r.seg.startsWith("sd") ? 0 : 1}`
  return q.sort((a, b) => rank(a).localeCompare(rank(b)))
}
