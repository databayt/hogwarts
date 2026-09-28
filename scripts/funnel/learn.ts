/**
 * The weekly learn — what the waves say, and what to try next.
 *
 *   pnpm crm:funnel-learn               report → scripts/crm/.data/learn/<date>.md
 *   pnpm crm:funnel-learn --propose     + one `claude -p` session writes ≤2 NEW
 *                                         variants (inactive) — only once a lane
 *                                         has MIN_SAMPLE sends
 *   pnpm crm:funnel-learn --post        + summary card to #hogwarts-funnel
 *
 * The /bench shape with a human at the end: hypothesis → variant → measure →
 * Abdout adopts (`pnpm crm:funnel-variant activate <id>`). Nothing here sends,
 * activates a variant or edits an existing one. Zero API spend: the proposal
 * runs on the Max pool through `claude -p`, one session per week.
 *
 * The report holds reply texts, so it lives under the gitignored .data/ —
 * this repo is public.
 */
import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  MIN_SAMPLE,
  replyRate,
  type LedgerRow,
  type VariantStats,
  type WaveLedger,
} from "@/lib/funnel/waves"

import { flag } from "./lib"
import { postCard } from "./notify"
import { loadAllLedgers, loadVariants, VARIANTS_FILE } from "./store"

const PROPOSE = flag("propose")
const POST = flag("post")
const INCLUDE_TESTS = flag("include-tests")

const blank = (): VariantStats => ({
  sent: 0,
  delivered: 0,
  bounced: 0,
  replied: 0,
  optedOut: 0,
})

function group(
  rows: LedgerRow[],
  keyOf: (r: LedgerRow) => string
): [string, VariantStats][] {
  const m = new Map<string, VariantStats>()
  for (const r of rows) {
    if (r.status === "failed") continue
    const k = keyOf(r)
    const s = m.get(k) ?? blank()
    s.sent++
    const has = (kind: string) => r.events.some((e) => e.kind === kind)
    if (has("delivered")) s.delivered++
    if (has("bounced")) s.bounced++
    if (has("replied")) s.replied++
    if (has("opted_out")) s.optedOut++
    m.set(k, s)
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

const table = (title: string, rows: [string, VariantStats][]) =>
  [
    `### ${title}`,
    "| key | sent | delivered | bounced | replied | opted out | reply rate |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
      ([k, s]) =>
        `| ${k} | ${s.sent} | ${s.delivered} | ${s.bounced} | ${s.replied} | ${s.optedOut} | ${s.sent - s.bounced >= MIN_SAMPLE ? `${Math.round(replyRate(s) * 100)}%` : `n<${MIN_SAMPLE}`} |`
    ),
  ].join("\n")

function medianHoursToReply(rows: LedgerRow[]): string {
  const hs = rows
    .map((r) => {
      const e = r.events.find((x) => x.kind === "replied")
      return e
        ? (new Date(e.at).getTime() - new Date(r.at).getTime()) / 3.6e6
        : null
    })
    .filter((x): x is number => x !== null)
    .sort((a, b) => a - b)
  return hs.length ? `${Math.round(hs[Math.floor(hs.length / 2)])}h` : "—"
}

function main() {
  const date = new Date().toISOString().slice(0, 10)
  const ledgers: WaveLedger[] = loadAllLedgers().filter(
    (l) => INCLUDE_TESTS || !l.wave.startsWith("e2e")
  )
  const rows = ledgers.flatMap((l) =>
    l.rows.map((r) => ({ ...r, wave: l.wave }))
  )
  const variants = loadVariants()
  const langOf = (id: string) => variants.find((v) => v.id === id)?.lang ?? "?"
  const live = rows.filter((r) => r.status !== "failed")
  const byLane = group(rows, (r) => r.lane)
  const laneSends = new Map(byLane.map(([k, s]) => [k, s.sent]))

  const replies = rows.flatMap((r) =>
    r.events
      .filter((e) => e.kind === "replied" || e.kind === "opted_out")
      .map(
        (e) =>
          `- **${r.name}** (${r.wave}, ${r.lane}, ${r.seg}, \`${r.variant}\`, ${e.kind}): ${e.note ?? "(no text — a WhatsApp reply dragged to WARM by hand)"}`
      )
  )

  const md = [
    `# Funnel learn — ${date}`,
    "",
    `Waves: ${ledgers.map((l) => `${l.wave} (${l.rows.length})`).join(" · ") || "none"} · messages out ${live.length} · replies ${live.filter((r) => r.events.some((e) => e.kind === "replied")).length} · median time to reply ${medianHoursToReply(live)}.`,
    live.length === 0
      ? "\n**Nothing has been sent yet — there is nothing to learn from. The bottleneck is sending.**"
      : "",
    "",
    `A rate is shown only at ≥${MIN_SAMPLE} reachable sends; below that it is noise and printed as n<${MIN_SAMPLE}. WhatsApp replies count only once a human drags the school to WARM (the reader cannot see a phone).`,
    "",
    table(
      "By variant",
      group(rows, (r) => r.variant)
    ),
    "",
    table("By lane", byLane),
    "",
    table(
      "By segment (rail-tier)",
      group(rows, (r) => r.seg)
    ),
    "",
    table(
      "By language",
      group(rows, (r) => langOf(r.variant))
    ),
    "",
    table(
      "By wave",
      group(rows, (r) => (r as LedgerRow & { wave: string }).wave)
    ),
    "",
    "### Replies, verbatim",
    ...(replies.length ? replies : ["(none yet)"]),
  ].join("\n")

  const dir = join(process.cwd(), "scripts/crm/.data/learn")
  mkdirSync(dir, { recursive: true })
  const out = join(dir, `${date}.md`)
  writeFileSync(out, md + "\n")
  console.log(md)
  console.log(`\nreport → ${out}`)

  const ready = [...laneSends.entries()].filter(([, n]) => n >= MIN_SAMPLE)
  if (PROPOSE && !ready.length)
    console.log(
      `\n--propose skipped: no lane has ${MIN_SAMPLE} sends yet (${[...laneSends.entries()].map(([k, n]) => `${k} ${n}`).join(", ") || "none"}). A proposal from less is a guess.`
    )
  if (PROPOSE && ready.length) {
    const prompt = `You improve the opening message a school-software company (Databayt, product «بالقلم» Balqalam) sends to schools. Read:
- ${out} (outcomes by variant, lane, segment, language, wave, and every reply verbatim)
- ${VARIANTS_FILE} (every variant, its hypothesis, which are active)

Propose AT MOST 2 new variants, only for lanes with ${MIN_SAMPLE}+ sends (${ready.map(([k]) => k).join(", ")}), each aimed at one specific finding in the report. Rules:
1. Append each to the "variants" array of ${VARIANTS_FILE} with "active": false, "parent": <the variant it changes>, "createdAt": "${date}", a NEW id (<lane-prefix>-<lang>@<n+1>, e.g. wa-ar@2), and "hypothesis": one sentence naming the number that motivates it and what should improve. Never edit or delete an existing entry.
2. Keep the {school} placeholder; email variants keep {deck}, a subject, and the one-word opt-out line (Arabic «إيقاف» / English "stop") — it is a legal courtesy, not copy to optimise away.
3. Truth only: the product does admissions and enrolment, fees/invoices/payroll, parent communication, attendance, grades, and a school website; the offer is a free 3-month trial with no fees and no commitment. Never invent a feature, price, customer, number, deadline or scarcity. Arabic is written natively, not translated.
4. One ask per message, and a small one. No sales theatre.
5. Then append a "## Proposals" section to ${out}: each new id, what it changes, why (cite the numbers), and "adopt with: pnpm crm:funnel-variant activate <id>".
If the numbers do not support a change, write nothing to the registry and say so in the Proposals section.`
    const res = spawnSync(
      "claude",
      [
        "-p",
        prompt,
        "--allowedTools",
        "Read",
        "Edit",
        "Write",
        "--max-turns",
        "30",
      ],
      { encoding: "utf8", timeout: 20 * 60_000 }
    )
    console.log(
      res.status === 0
        ? "\nproposals written (inactive) — see the report and `pnpm crm:funnel-variant`"
        : `\nclaude -p exited ${res.status}: ${(res.stderr || "").slice(0, 300)}`
    )
  }

  if (POST) {
    const lines = group(rows, (r) => r.variant).map(
      ([k, s]) =>
        `• \`${k}\` sent ${s.sent} · replied ${s.replied} · bounced ${s.bounced}`
    )
    const proposed = loadVariants().filter(
      (v) => !v.active && v.createdAt === date
    )
    postCard(
      `📊 *Weekly funnel learn — ${date}*\n${lines.join("\n") || "Nothing sent yet."}\n${proposed.length ? `\n*New proposals (inactive):* ${proposed.map((v) => `\`${v.id}\` — ${v.hypothesis}`).join("\n")}\nAdopt: \`pnpm crm:funnel-variant activate <id>\`` : ""}\nNext wave plan: \`pnpm crm:funnel-next-wave\``,
      "Funnel · weekly learn"
    )
  }
}

main()
