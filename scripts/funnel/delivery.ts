/**
 * What happened to each wave email after Resend accepted it — delivered,
 * bounced, or marked as spam — read back from `GET /emails/<id>`
 * (`last_event`) and stamped on the wave ledger once per kind.
 *
 * A bounce is not disinterest: it is an address that never reached anyone,
 * so it comes OUT of the reply-rate denominator (see `replyRate`) and the
 * school goes back to the contact-gap lane (outreachStatus → FAILED).
 *
 *   pnpm crm:funnel-delivery            dry: print what would be stamped
 *   pnpm crm:funnel-delivery --apply    stamp ledger + Twenty (loop.sh)
 */
import type { EventKind } from "@/lib/funnel/waves"

import { twentyClient } from "../crm/twenty-rest"
import { flag, loadEnv } from "./lib"
import { postCard } from "./notify"
import { addEvent, loadAllLedgers } from "./store"

loadEnv()
const APPLY = flag("apply")

const MAP: Record<string, EventKind | undefined> = {
  delivered: "delivered",
  bounced: "bounced",
  complained: "complained",
}

async function main() {
  const key = (process.env.RESEND_API_KEY ?? "").trim()
  if (!key) throw new Error("RESEND_API_KEY missing")
  const t = APPLY ? twentyClient() : null
  let checked = 0
  let stamped = 0
  for (const l of loadAllLedgers())
    for (const r of l.rows) {
      if (r.lane !== "email" || r.status !== "sent" || !r.resendId) continue
      // Final states need no re-read.
      if (r.events.some((e) => e.kind === "bounced" || e.kind === "complained"))
        continue
      if (r.events.some((e) => e.kind === "delivered")) continue
      const res = await fetch(`https://api.resend.com/emails/${r.resendId}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      checked++
      if (!res.ok) {
        console.log(`  ? ${r.name.slice(0, 50)}  resend ${res.status}`)
        continue
      }
      const j = (await res.json()) as { last_event?: string }
      const kind = MAP[j.last_event ?? ""]
      console.log(
        `  ${(j.last_event ?? "?").padEnd(10)} ${r.name.slice(0, 50)} → ${r.to}`
      )
      if (!kind || !APPLY) continue
      if (
        addEvent(l.wave, r.companyId, {
          at: new Date().toISOString(),
          kind,
        })
      )
        stamped++
      if (kind === "bounced" || kind === "complained") {
        await t!
          .rest("PATCH", `companies/${r.companyId}`, {
            outreachStatus: "FAILED",
          })
          .catch(() => {})
        postCard(
          `📭 *${r.name}* — email ${kind} (${r.to}, wave ${l.wave}). Marked FAILED; the address needs replacing before any retry.`,
          "Funnel · delivery"
        )
      }
      await new Promise((ok) => setTimeout(ok, 250))
    }
  console.log(`checked ${checked} · stamped ${stamped}${APPLY ? "" : " (dry)"}`)
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
)
