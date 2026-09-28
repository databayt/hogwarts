/**
 * The variant registry — list, and Abdout's yes/no on proposals.
 *
 *   pnpm crm:funnel-variant                  list, with sends + reply rate
 *   pnpm crm:funnel-variant show <id>        print the full text
 *   pnpm crm:funnel-variant activate <id>    adopt a proposal from the learner
 *   pnpm crm:funnel-variant retire <id>      stop sending it (history is kept)
 *
 * The learner only ever writes INACTIVE variants; turning one on is the
 * human's act. Nothing is deleted — a retired variant's sends stay
 * attributable in the ledgers.
 */
import { renderVariant, replyRate, variantStats } from "@/lib/funnel/waves"

import { DECK_URL } from "./lib"
import { loadAllLedgers, loadVariants, saveVariants } from "./store"

const [cmd = "list", id] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"))
const variants = loadVariants()
const stats = variantStats(loadAllLedgers())

function find(vid: string | undefined) {
  const v = variants.find((x) => x.id === vid)
  if (!v) throw new Error(`no variant "${vid}" — run with no args to list`)
  return v
}

if (cmd === "list") {
  console.log(
    "\n  id                 lane      lang active  sent  replied  rate   parent"
  )
  for (const v of variants) {
    const s = stats.get(v.id)
    console.log(
      `  ${v.id.padEnd(18)} ${v.lane.padEnd(9)} ${v.lang.padEnd(4)} ${(v.active ? "yes" : "—").padEnd(6)} ${String(s?.sent ?? 0).padStart(5)} ${String(s?.replied ?? 0).padStart(8)}  ${(replyRate(s) * 100).toFixed(0).padStart(3)}%   ${v.parent ?? ""}`
    )
    if (!v.active && v.hypothesis) console.log(`      ↳ ${v.hypothesis}`)
  }
  console.log("")
} else if (cmd === "show") {
  const v = find(id)
  const r = renderVariant(v, { school: "‹اسم المدرسة›", deck: DECK_URL })
  console.log(
    `\n${v.id}  (${v.lane}, ${v.lang}, ${v.active ? "active" : "inactive"})`
  )
  if (v.hypothesis) console.log(`hypothesis: ${v.hypothesis}`)
  if (r.subject) console.log(`subject: ${r.subject}`)
  console.log(`\n${r.text}\n`)
} else if (cmd === "activate" || cmd === "retire") {
  const v = find(id)
  v.active = cmd === "activate"
  saveVariants(variants)
  const live = variants.filter((x) => x.active && x.lane === v.lane)
  console.log(
    `${v.id} → ${v.active ? "ACTIVE" : "retired"}. Active in ${v.lane}: ${live.map((x) => x.id).join(", ") || "NONE — this lane cannot send"}`
  )
} else {
  console.error(
    `unknown command "${cmd}" — list | show <id> | activate <id> | retire <id>`
  )
  process.exit(1)
}
