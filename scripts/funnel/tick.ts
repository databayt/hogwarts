/**
 * The roll — drain today's quota of reachable, unmessaged schools.
 *
 *   pnpm crm:funnel-tick                                       # dry: both lanes' plan
 *   pnpm crm:funnel-tick --lane=whatsapp --segment='sd-*' --limit=10 --apply
 *   pnpm crm:funnel-tick --lane=email --segment='gulf-*' --limit=10 \
 *        --reply-to=<real mailbox> --apply
 *
 * Flags: --lane=<whatsapp|email> --segment=<glob over "<rail>-<tier>">
 *        --limit=<N> --reply-to=<addr> --from=<addr> --apply
 *
 * POPULATION vs SCHEDULE: every reachable school is in the queue (377 at first
 * census); the ramp only sets drain speed — 10/day week 1 → 20 → 30 (a fresh
 * WhatsApp number and a fresh sender domain both warm up, and an unbounded
 * blast is how either gets burned). --limit is REQUIRED on --apply.
 *
 * WHAT EACH LANE ACTUALLY DOES
 *
 *   whatsapp  Flips stage → SHORTLISTED and stops. The Twenty workflow
 *             ("School shortlisted → outreach") owns the rest: HTTP → Hermes →
 *             a Slack card with the opening message + wa.me link → a HUMAN
 *             sends and marks SENT. Refused unless that workflow has an ACTIVE
 *             version — flipping stages with no workflow just strands them.
 *             The same PATCH writes the E.164 this lane verified back onto
 *             `schoolPhone`: the workflow body and the Slack card read that
 *             field RAW (`wa.me/{{trigger.properties.after.schoolPhone}}`), so
 *             a number stored as "055941771" would have produced a card whose
 *             link dials nothing. Idempotent — the trigger only watches `stage`.
 *
 *   email     Sends touch-1 itself via Resend (databayt.org is the verified
 *             domain) and stamps stage=CONTACTED, outreachStatus=SENT,
 *             lastOutreachAt. Direct-send because the deployed workflow
 *             filters on schoolPhone, which email-only schools don't have.
 *             Touch 1 is TEMPLATED (openingMessage, reviewed at
 *             template-time), which is why it may send unattended — drafted
 *             touches (3+) never may. --reply-to is REQUIRED and must be a
 *             mailbox a person reads: stop-on-reply is the lane's hardest
 *             rule, and a reply that lands nowhere is a lead silently lost.
 *
 * Kill switch: FUNNEL_SEND=off in the environment refuses every --apply.
 * Idempotent: only stage COLD/PROSPECT + outreachStatus NOT_STARTED/absent
 * enter the queue, so a re-run cannot double-message anyone.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { twentyClient, type TwentyClient } from "../crm/twenty-rest"
import {
  argv,
  DECK_URL,
  emailOf,
  flag,
  isMobile,
  loadEnv,
  openingMessage,
  railOf,
  toE164,
} from "./lib"

loadEnv()

const APPLY = flag("apply")
const LANE = argv("lane") // whatsapp | email | '' (dry shows both)
const SEGMENT = argv("segment")
const LIMIT = parseInt(argv("limit", "0"), 10) || 0
const REPLY_TO = argv("reply-to")
const FROM = argv("from", "فريق بالقلم <noreply@databayt.org>")
const WORKFLOW_NAME = "School shortlisted → outreach"

interface Company {
  id: string
  name?: string | null
  stage?: string | null
  tier?: string | null
  country?: string | null
  schoolPhone?: string | null
  principalContact?: string | null
  outreachStatus?: string | null
}

interface QueueRow {
  id: string
  name: string
  tier: string
  seg: string
  lane: "whatsapp" | "email"
  to: string // e164 or email
}

const globToRe = (g: string) =>
  new RegExp(
    `^${g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
    "i"
  )

function buildQueue(rows: Company[]): QueueRow[] {
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
    })
  }
  // Tier A first, then B; sd rail leads inside a tier (WhatsApp-first market).
  const rank = (r: QueueRow) =>
    `${{ A: 0, B: 1 }[r.tier] ?? 2}-${r.seg.startsWith("sd") ? 0 : 1}`
  return q.sort((a, b) => rank(a).localeCompare(rank(b)))
}

async function workflowIsActive(t: TwentyClient): Promise<boolean> {
  try {
    const wfRes = await t.rest<{
      data?: { workflows?: Array<{ id: string; name: string }> }
    }>("GET", "workflows?limit=50")
    const wf = (wfRes?.data?.workflows ?? []).find(
      (w) => w.name === WORKFLOW_NAME
    )
    if (!wf) return false
    const vRes = await t.rest<{
      data?: { workflowVersions?: Array<{ status: string }> }
    }>("GET", `workflowVersions?limit=20&filter=workflowId[eq]:${wf.id}`)
    return (vRes?.data?.workflowVersions ?? []).some(
      (v) => v.status === "ACTIVE"
    )
  } catch {
    return false
  }
}

async function sendEmailTouch(to: string, school: string): Promise<string> {
  const key = (process.env.RESEND_API_KEY ?? "").trim()
  if (!key) throw new Error("RESEND_API_KEY missing")
  const text = [
    openingMessage(school),
    "",
    `العرض التعريفي: ${DECK_URL}`,
    "",
    "إن لم ترغبوا بمراسلاتنا مستقبلاً، يكفي الرد بكلمة «إيقاف».",
  ].join("\n")
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: FROM,
      to,
      reply_to: REPLY_TO,
      subject: "منصة «بالقلم» لإدارة المدارس — تجربة مجانية ٣ أشهر لمدرستكم",
      text,
    }),
  })
  const json = (await res.json().catch(() => ({}))) as {
    id?: string
    message?: string
  }
  if (!res.ok) throw new Error(`Resend ${res.status}: ${json.message ?? ""}`)
  return json.id ?? "?"
}

async function main() {
  if (APPLY && (process.env.FUNNEL_SEND ?? "").toLowerCase() === "off")
    throw new Error("FUNNEL_SEND=off — the kill switch is on; nothing sends.")
  if (APPLY && !LIMIT)
    throw new Error(
      "--apply needs --limit=<N>. The ramp is 10/day week 1 → 20 → 30; an unbounded send is how a number or a domain gets burned."
    )
  if (APPLY && !LANE)
    throw new Error(
      "--apply needs --lane=whatsapp|email — one lane per deliberate act."
    )
  if (APPLY && !SEGMENT)
    throw new Error(
      "--apply needs --segment (e.g. --segment=sd-A or --segment=gulf-*). An unsegmented blast erases the reason this lane exists."
    )

  const t = twentyClient()
  console.log("Reading companies from Twenty …")
  const rows = (await t.all("companies")) as unknown as Company[]
  let queue = buildQueue(rows)

  const segRe = SEGMENT ? globToRe(SEGMENT) : null
  if (segRe) queue = queue.filter((r) => segRe.test(r.seg))
  const laneQueue = (lane: string) => queue.filter((r) => r.lane === lane)

  console.log(`\n═══ Funnel tick — the roll ═══`)
  console.log(
    `  queue (reachable, unmessaged${SEGMENT ? `, segment ${SEGMENT}` : ""}): whatsapp ${laneQueue("whatsapp").length} · email ${laneQueue("email").length}`
  )
  const segTally = new Map<string, number>()
  for (const r of queue) segTally.set(r.seg, (segTally.get(r.seg) ?? 0) + 1)
  console.log(
    `  by segment: ${[...segTally.entries()]
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ")}\n`
  )

  if (!APPLY) {
    for (const lane of ["whatsapp", "email"] as const) {
      const batch = laneQueue(lane).slice(0, LIMIT || 10)
      console.log(`  ${lane} — next ${batch.length} (dry):`)
      for (const r of batch)
        console.log(`    [${r.seg}] ${r.name.slice(0, 48)} → ${r.to}`)
      console.log("")
    }
    console.log(
      "  Dry run. To roll: --lane=<whatsapp|email> --segment=<glob> --limit=<N> --apply"
    )
    if (!(await workflowIsActive(t)))
      console.log(
        `  ⚠ workflow "${WORKFLOW_NAME}" has no ACTIVE version — the whatsapp lane will refuse --apply until it is deployed + activated over the API (sequence + verifier: scripts/crm/workflow-spec.ts).`
      )
    return
  }

  const batch = laneQueue(LANE).slice(0, LIMIT)
  if (!batch.length)
    throw new Error(
      `nothing in the ${LANE} lane for segment ${SEGMENT} — nothing sent.`
    )

  if (LANE === "whatsapp") {
    if (!(await workflowIsActive(t)))
      throw new Error(
        `workflow "${WORKFLOW_NAME}" has no ACTIVE version. Flipping stages now would strand ${batch.length} schools at SHORTLISTED with no Slack card and no message. Deploy + activate it over the API first (sequence + verifier: scripts/crm/workflow-spec.ts), then re-run.`
      )
    console.log(
      `  Flipping ${batch.length} → SHORTLISTED (the workflow takes it from there):`
    )
    const done: string[] = []
    for (const r of batch) {
      // `r.to` IS the verified E.164 mobile in this lane — write it back so the
      // card's wa.me link is built from a dialable number, not the raw import.
      await t.rest("PATCH", `companies/${r.id}`, {
        stage: "SHORTLISTED",
        schoolPhone: r.to,
      })
      console.log(`    ✓ [${r.seg}] ${r.name.slice(0, 48)}`)
      done.push(r.id)
    }
    receipt(LANE, batch, done)
  } else if (LANE === "email") {
    if (!REPLY_TO || !emailOf(REPLY_TO))
      throw new Error(
        "--reply-to=<real mailbox> is required for the email lane. Stop-on-reply is the hardest rule here — a reply must land where a person reads, or the lead is silently lost."
      )
    console.log(
      `  Sending ${batch.length} touch-1 emails (from ${FROM}, replies → ${REPLY_TO}):`
    )
    const done: string[] = []
    for (const r of batch) {
      try {
        const id = await sendEmailTouch(r.to, r.name)
        await t.rest("PATCH", `companies/${r.id}`, {
          stage: "CONTACTED",
          outreachStatus: "SENT",
          lastOutreachAt: new Date().toISOString(),
        })
        console.log(
          `    ✓ [${r.seg}] ${r.name.slice(0, 48)} → ${r.to}  (resend ${id})`
        )
        done.push(r.id)
      } catch (e) {
        await t
          .rest("PATCH", `companies/${r.id}`, { outreachStatus: "FAILED" })
          .catch(() => {})
        console.log(
          `    ✗ [${r.seg}] ${r.name.slice(0, 48)} → ${r.to}  ${e instanceof Error ? e.message : e}`
        )
      }
      await new Promise((r2) => setTimeout(r2, 600))
    }
    receipt(LANE, batch, done)
  } else {
    throw new Error(`unknown --lane=${LANE}`)
  }
  console.log(
    `\n  Re-measure: pnpm crm:funnel-gates  (the yield ledger diffs the artifact)\n`
  )
}

function receipt(lane: string, batch: QueueRow[], done: string[]) {
  const dir = join(process.cwd(), "scripts/crm/.data")
  mkdirSync(dir, { recursive: true })
  const out = join(
    dir,
    `funnel-tick-${new Date().toISOString().slice(0, 10)}-${lane}.json`
  )
  writeFileSync(
    out,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        lane,
        segment: SEGMENT,
        limit: LIMIT,
        attempted: batch.length,
        applied: done.length,
        ids: done,
      },
      null,
      2
    )
  )
  console.log(`  receipt → ${out}`)
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(String(e instanceof Error ? e.message : e))
    process.exit(1)
  }
)
