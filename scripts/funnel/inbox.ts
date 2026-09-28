/**
 * Replies to wave emails → the gate. Reads the reply-to mailbox (hotmail,
 * through Mail.app — the same account the kun jobs loop reads; both only
 * READ, neither moves or marks a message), matches each message to a school
 * the wave ledgers say we emailed, classifies it, and acts:
 *
 *   reply       ledger `replied` · Twenty stage → WARM (ALONE, first) then
 *               outreachStatus → REPLIED (second call) · Slack card
 *   opt_out     ledger `opted_out` · outreachStatus → OPTED_OUT · card
 *   auto_reply  ledger `auto_reply` only (out-of-office is not a reply)
 *   ambiguous   card only — a human reads it
 *
 * Why two PATCHes: the WARM applier (src/lib/funnel/apply-inbox.ts) treats a
 * stage change that arrives WITH an outreachStatus change as the workflow's
 * own echo and ignores it. Stage alone is what it recognises as a reply, and
 * that is the path that creates the prod Prospect + Lead.
 *
 *   pnpm crm:funnel-inbox                 dry: classify + print, change nothing
 *   pnpm crm:funnel-inbox --apply         act (loop.sh runs this)
 *   pnpm crm:funnel-inbox --hours=72      look further back
 *
 * WhatsApp replies land on a phone, not here: for that lane the human drags
 * the school to WARM in Twenty, which is the same applier path.
 */
import { spawnSync } from "node:child_process"

import {
  classifySchoolReply,
  matchSender,
  newText,
  senderAddress,
  type SentTarget,
} from "@/lib/funnel/reply"

import { twentyClient } from "../crm/twenty-rest"
import { argv, flag, loadEnv } from "./lib"
import { postCard } from "./notify"
import { addEvent, loadAllLedgers, readState, writeState } from "./store"

loadEnv()

const APPLY = flag("apply")
const MAILBOX = argv("mailbox", (process.env.FUNNEL_MAILBOX ?? "").trim())
const BEFORE_WARM = new Set(["COLD", "PROSPECT", "SHORTLISTED", "CONTACTED"])

interface Mail {
  from: string
  subject: string
  date: string
  body: string
}

function readMail(hours: number): Mail[] | string {
  const res = spawnSync(
    "osascript",
    ["scripts/funnel/mail-read.applescript", MAILBOX, String(hours)],
    { encoding: "utf8", timeout: 180_000, maxBuffer: 20 * 1024 * 1024 }
  )
  if (res.status !== 0) return (res.stderr || res.stdout).trim()
  return res.stdout
    .split("\x1e")
    .map((r) => r.split("\x1f"))
    .filter((f) => f.length >= 4)
    .map(([from, subject, date, body]) => ({
      from: from.trim(),
      subject: subject.trim(),
      date: date.trim(),
      body,
    }))
}

/** Mail.app prints "2026-9-28 10:33:04" (or with AM/PM); fall back to now. */
function receivedAt(d: string): Date {
  const m = d.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i
  )
  if (!m) return new Date()
  let h = Number(m[4])
  if (m[7]?.toUpperCase() === "PM" && h < 12) h += 12
  if (m[7]?.toUpperCase() === "AM" && h === 12) h = 0
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    h,
    Number(m[5]),
    Number(m[6] ?? 0)
  )
}

async function main() {
  const state = readState<{ last?: string; seen: string[] }>("inbox", {
    seen: [],
  })
  const hoursArg = Number(argv("hours", "0"))
  const hours =
    hoursArg ||
    (state.last
      ? Math.min(
          96,
          Math.ceil((Date.now() - new Date(state.last).getTime()) / 3_600_000) +
            2
        )
      : 72)

  // What we emailed: every non-failed email row of every wave.
  const targets: (SentTarget & { wave: string; name: string })[] = []
  for (const l of loadAllLedgers())
    for (const r of l.rows)
      if (r.lane === "email" && r.status === "sent")
        targets.push({
          companyId: r.companyId,
          email: r.to,
          at: r.at,
          wave: l.wave,
          name: r.name,
        })
  if (!targets.length) {
    console.log("no emailed schools in any wave ledger — nothing to match")
    return
  }

  const mail = readMail(hours)
  if (typeof mail === "string") {
    console.log(`inbox NOT read (${MAILBOX}): ${mail}`)
    process.exitCode = 1
    return
  }
  const seen = new Set(state.seen)
  console.log(
    `${APPLY ? "" : "DRY — "}${mail.length} message(s) in the last ${hours}h · ${targets.length} emailed school(s) to match`
  )

  const t = APPLY ? twentyClient() : null
  let matched = 0
  for (const m of mail) {
    const key = `${m.from}|${m.subject}|${m.date}`
    if (seen.has(key)) continue
    const hit = matchSender(m.from, receivedAt(m.date), targets)
    if (!hit) continue
    const target = targets.find((x) => x.companyId === hit.companyId)!
    const kind = classifySchoolReply(m)
    const fresh = newText(m.body).replace(/\s+/g, " ").slice(0, 400)
    matched++
    console.log(
      `  ${kind.padEnd(10)} ${target.name.slice(0, 50)}  ← ${senderAddress(m.from)} "${m.subject.slice(0, 50)}"`
    )
    if (!APPLY) continue
    seen.add(key)

    const at = new Date().toISOString()
    const link = `https://hogwarts.databayt.org/object/company/${target.companyId}`
    if (kind === "reply") {
      addEvent(target.wave, target.companyId, {
        at,
        kind: "replied",
        note: fresh,
      })
      const c = (await t!.rest("GET", `companies/${target.companyId}`)) as {
        data?: { company?: { stage?: string } }
      }
      const stage = c?.data?.company?.stage ?? ""
      if (BEFORE_WARM.has(stage)) {
        await t!.rest("PATCH", `companies/${target.companyId}`, {
          stage: "WARM",
        })
        await t!.rest("PATCH", `companies/${target.companyId}`, {
          outreachStatus: "REPLIED",
        })
      }
      postCard(
        `💬 *${target.name}* replied (wave ${target.wave}) — ${BEFORE_WARM.has(stage) ? "moved to *WARM*" : `already at ${stage}, stage untouched`}\n📧 ${senderAddress(m.from)} — "${m.subject}"\n> ${fresh}\n\nAnswer from hotmail within the day. The deck: https://balqalam.com/decks/balqalam.pdf\n${link}`,
        "Funnel · reply"
      )
    } else if (kind === "opt_out") {
      addEvent(target.wave, target.companyId, {
        at,
        kind: "opted_out",
        note: fresh,
      })
      await t!.rest("PATCH", `companies/${target.companyId}`, {
        outreachStatus: "OPTED_OUT",
      })
      postCard(
        `🛑 *${target.name}* opted out (wave ${target.wave}). Marked OPTED_OUT — never message again.\n> ${fresh}`,
        "Funnel · opt-out"
      )
    } else if (kind === "auto_reply") {
      addEvent(target.wave, target.companyId, {
        at,
        kind: "auto_reply",
        note: fresh,
      })
    } else {
      postCard(
        `❓ *${target.name}* — a message the rules could not call (${kind}). A human reads it:\n📧 ${senderAddress(m.from)} — "${m.subject}"\n> ${fresh}\n${link}`,
        "Funnel · check this"
      )
    }
  }

  if (APPLY)
    writeState("inbox", {
      last: new Date().toISOString(),
      seen: [...seen].slice(-2000),
    })
  console.log(`matched ${matched}${APPLY ? "" : " (dry — nothing written)"}`)
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
)
