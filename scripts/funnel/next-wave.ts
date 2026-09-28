/**
 * Plan the next wave — PRINTS the commands, never runs them.
 *
 *   pnpm crm:funnel-next-wave                 plan wN+1 from the ledgers + queue
 *   pnpm crm:funnel-next-wave --size=20       override the per-lane size
 *
 * Size follows the ramp (10 → 20 → 30 per lane; a fresh sender domain and a
 * fresh WhatsApp number both warm up, and a burned one is gone). Within a
 * lane, schools are split across segments (rail-tier) in proportion to a
 * smoothed reply rate — (replied+1)/(reached+2), so an unmeasured segment
 * starts at 50% and is never starved — with at least one school per segment
 * that has a queue. The variant split (~80/20 incumbent/challenger) happens
 * inside tick per school; this plan only decides WHO.
 *
 * Sending to a real school is Abdout's typed act: this prints the exact
 * `crm:funnel-tick … --apply` lines for him to run, and nothing else.
 */
import type { LedgerRow, WaveLedger } from "@/lib/funnel/waves"

import { twentyClient } from "../crm/twenty-rest"
import { argv, loadEnv } from "./lib"
import { buildQueue, type Company } from "./queue"
import { loadAllLedgers } from "./store"

loadEnv()

const RAMP = [10, 20, 30]

async function main() {
  const ledgers: WaveLedger[] = loadAllLedgers().filter((l) =>
    /^w\d+$/.test(l.wave)
  )
  const n = ledgers.length
  const next = `w${n + 1}`
  const size = Number(argv("size", "0")) || RAMP[Math.min(n, RAMP.length - 1)]

  const last = ledgers.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[
    n - 1
  ]
  if (last) {
    const ageH = (Date.now() - new Date(last.createdAt).getTime()) / 3.6e6
    if (ageH < 72)
      console.log(
        `⚠ ${last.wave} went out ${Math.round(ageH)}h ago — schools answer in days, not hours. Judge it after 72h; planning anyway.`
      )
  }

  // Smoothed reply rate per segment from every real wave.
  const rows: LedgerRow[] = ledgers.flatMap((l) => l.rows)
  const seg = new Map<string, { reached: number; replied: number }>()
  for (const r of rows) {
    if (r.status === "failed") continue
    const s = seg.get(r.seg) ?? { reached: 0, replied: 0 }
    if (!r.events.some((e) => e.kind === "bounced")) s.reached++
    if (r.events.some((e) => e.kind === "replied")) s.replied++
    seg.set(r.seg, s)
  }
  const score = (k: string) => {
    const s = seg.get(k) ?? { reached: 0, replied: 0 }
    return (s.replied + 1) / (s.reached + 2)
  }

  const t = twentyClient()
  const queue = buildQueue((await t.all("companies")) as unknown as Company[])

  console.log(`\n═══ Next wave: ${next} — ${size} per lane ═══\n`)
  for (const lane of ["email", "whatsapp"] as const) {
    const q = queue.filter((r) => r.lane === lane)
    const segs = [...new Set(q.map((r) => r.seg))]
      // tier A/B before C: C is the long tail, and a first impression spent
      // there teaches least.
      .filter(
        (s) =>
          !s.endsWith("-C") ||
          q.filter((r) => /-(A|B)$/.test(r.seg)).length < size
      )
    if (!segs.length) {
      console.log(`  ${lane}: queue empty`)
      continue
    }
    const total = segs.reduce((a, s) => a + score(s), 0)
    let alloc = segs.map((s) => ({
      seg: s,
      avail: q.filter((r) => r.seg === s).length,
      n: Math.max(1, Math.round((score(s) / total) * size)),
    }))
    alloc = alloc.map((a) => ({ ...a, n: Math.min(a.n, a.avail) }))
    // Trim or fill to the lane size, best-scoring segments first.
    alloc.sort((a, b) => score(b.seg) - score(a.seg))
    let sum = alloc.reduce((a, x) => a + x.n, 0)
    for (const a of [...alloc].reverse()) {
      while (sum > size && a.n > 1) (a.n--, sum--)
    }
    for (const a of alloc) {
      while (sum < size && a.n < a.avail) (a.n++, sum++)
    }
    console.log(`  ${lane} (${sum} of ${q.length} queued):`)
    for (const a of alloc.filter((x) => x.n > 0)) {
      const s = seg.get(a.seg)
      console.log(
        `    ${a.seg.padEnd(8)} ${String(a.n).padStart(3)}   (history: ${s ? `${s.replied}/${s.reached} replied` : "unmeasured"})`
      )
    }
    console.log("")
    for (const a of alloc.filter((x) => x.n > 0))
      console.log(
        `    pnpm crm:funnel-tick --lane=${lane} --segment=${a.seg} --limit=${a.n} --wave=${next} --apply`
      )
    console.log("")
  }
  console.log(
    "Dry-run any line first by dropping --apply. The WhatsApp lane posts cards to #hogwarts-funnel; a person sends each one and marks SENT."
  )
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
)
