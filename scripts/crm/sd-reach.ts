// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Is each Sudanese school actually reachable? Check every channel, then say so in Twenty.
 *
 * Scope is the Sudanese book: `country=SD` (operating in Sudan) OR `originCountry=SD`
 * (relocated to Egypt, Saudi, Uganda … after April 2023). For each school it tests
 * what can be tested without sending anyone a message:
 *
 *   phone   — `normalizePhone` → MOBILE (WhatsApp-able) / LANDLINE / NOT_DIALABLE,
 *             plus a placeholder filter (`+249900000007` is a form default, not a line)
 *   email   — syntax + the domain resolves MX (or A, the RFC 5321 fallback)
 *   website — answers HTTP < 400 within 12s. 401/403 count as up: a bot wall is a
 *             live server. Map pins, Telegram and Google Forms in `domainName` are
 *             not school sites and are skipped, not failed.
 *   facebook — recorded, never fetched: FB answers 400 to unauthenticated reads, so
 *             a check here would only measure Facebook.
 *
 * Reachable follows the funnel-gates definition (`scripts/funnel/gates.ts`): a
 * verified mobile (WhatsApp lane) or a deliverable email. A landline is callable but
 * stays out — Sudan's fixed network is largely down since the war, and a landline
 * in a WhatsApp campaign is a silent non-delivery.
 *
 * Writes, and the rules that keep them safe:
 *   leadStatus      UNREVIEWED/REVIEWED/empty → REACHABLE when reachable, else REVIEWED.
 *                   REACHABLE → REVIEWED only when NO live channel of any kind is left
 *                   (a human may have set it from a site or page). SHORTLISTED,
 *                   CONTACTED, QUALIFIED are human decisions and never touched.
 *   contactVerified true when reachable; false when a phone/email existed and every
 *                   one failed (a landline counts as valid); left alone when there was nothing to verify.
 *   lastSeenAt      set to now when the school's own website is live.
 * `stage` is never written.
 *
 * Dry-run by default; `--apply` writes back through the REST API.
 *
 *   TWENTY_API_URL=http://localhost:3100 \
 *   TWENTY_API_KEY=$(security find-generic-password -s databayt-twenty -a hogwarts -w) \
 *     npx tsx scripts/crm/sd-reach.ts [--apply] [--limit=N]
 */
import { resolve4, resolveMx } from "node:dns/promises"
import { mkdirSync, writeFileSync } from "node:fs"

import { normalizePhone, type Reach } from "./normalize-contacts"
import { twentyClient } from "./twenty-rest"

const APPLY = process.argv.includes("--apply")
const arg = (n: string, d = ""): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.split("=").slice(1).join("=") : d
}

interface Link {
  primaryLinkUrl?: string | null
}
interface Company {
  id: string
  name?: string | null
  country?: string | null
  originCountry?: string | null
  stage?: string | null
  leadStatus?: string | null
  contactVerified?: boolean | null
  lastSeenAt?: string | null
  schoolPhone?: string | null
  principalContact?: string | null
  facebook?: Link | null
  domainName?: Link | null
}

const HUMAN_STATUSES = new Set(["SHORTLISTED", "CONTACTED", "QUALIFIED"])
const EMAIL = /[^\s@,;<>]+@[^\s@,;<>]+\.[a-z]{2,}/gi
const NOT_A_SITE =
  /(^|\.)(bing\.com|google\.[a-z.]+|goo\.gl|facebook\.com|fb\.me|fb\.com|m\.me|messenger\.com|instagram\.com|threads\.(com|net)|t\.me|wa\.me|whatsapp\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com|linktr\.ee)$/i
const PARKED =
  /sedo|hugedomains|dan\.com|afternic|parkingcrew|bodis|godaddy\.com\/domains/i

// A form default or a typo, not a line: long zero runs or one digit repeated.
const isPlaceholder = (e164: string): boolean =>
  /0{5,}/.test(e164) || /(\d)\1{6,}/.test(e164)

function phonesOf(c: Company): string[] {
  const raw = [c.schoolPhone ?? "", c.principalContact ?? ""].join(" ")
  const fromWa = [...raw.matchAll(/wa\.me\/(\d{8,15})/g)].map((m) => `+${m[1]}`)
  const plain = raw
    .replace(EMAIL, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[,;/|\n]+/)
    .map((s) => s.trim())
    .filter((s) => (s.match(/\d/g) ?? []).length >= 7)
  return [...new Set([...fromWa, ...plain])]
}

const emailsOf = (c: Company): string[] => [
  ...new Set(
    [c.principalContact ?? "", c.schoolPhone ?? ""]
      .join(" ")
      .match(EMAIL)
      ?.map((e) => e.toLowerCase()) ?? []
  ),
]

const mxCache = new Map<string, Promise<boolean>>()
function domainTakesMail(domain: string): Promise<boolean> {
  if (!mxCache.has(domain)) {
    mxCache.set(
      domain,
      resolveMx(domain)
        .then((mx) => mx.length > 0)
        .catch(() =>
          resolve4(domain)
            .then((a) => a.length > 0)
            .catch(() => false)
        )
    )
  }
  return mxCache.get(domain)!
}

async function siteIsLive(
  url: string
): Promise<{ live: boolean; why: string }> {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
  try {
    const res = await fetch(href, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      },
    })
    if (PARKED.test(res.url)) return { live: false, why: `parked → ${res.url}` }
    const live = res.status < 400 || res.status === 401 || res.status === 403
    return { live, why: `HTTP ${res.status}` }
  } catch (e) {
    const cause = (e as { cause?: { code?: string } }).cause?.code
    return { live: false, why: cause ?? (e as Error).name }
  }
}

interface Verdict {
  id: string
  name: string
  country: string
  stage: string
  phones: { raw: string; e164: string | null; reach: Reach | "PLACEHOLDER" }[]
  emails: { email: string; ok: boolean }[]
  site: { url: string; live: boolean; why: string } | null
  facebook: string | null
  reachable: boolean
  patch: Record<string, unknown>
}

async function judge(c: Company): Promise<Verdict> {
  const hint = c.country ?? "SD"
  const phones = phonesOf(c).map((raw) => {
    const n = normalizePhone(raw, hint)
    const reach: Reach | "PLACEHOLDER" =
      n.e164 && isPlaceholder(n.e164) ? "PLACEHOLDER" : n.reach
    return { raw, e164: n.e164, reach }
  })
  const emails = await Promise.all(
    emailsOf(c).map(async (email) => ({
      email,
      ok: await domainTakesMail(email.split("@")[1]),
    }))
  )

  const url = (c.domainName?.primaryLinkUrl ?? "").trim()
  let site: Verdict["site"] = null
  if (url) {
    let host = ""
    try {
      host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
        .hostname
    } catch {}
    if (host && !NOT_A_SITE.test(host))
      site = { url, ...(await siteIsLive(url)) }
  }
  const facebook = (c.facebook?.primaryLinkUrl ?? "").trim() || null

  const mobile = phones.some((p) => p.reach === "MOBILE")
  const mail = emails.some((e) => e.ok)
  const reachable = mobile || mail
  const anyLive =
    reachable ||
    phones.some((p) => p.reach === "LANDLINE") ||
    !!site?.live ||
    !!facebook
  const hadContact = phones.length > 0 || emails.length > 0
  // A landline is a valid number, just not a WhatsApp one — it did not fail.
  const anyValid = reachable || phones.some((p) => p.reach === "LANDLINE")

  const patch: Record<string, unknown> = {}
  const status = c.leadStatus ?? null
  if (!HUMAN_STATUSES.has(status ?? "")) {
    if (reachable) {
      if (status !== "REACHABLE") patch.leadStatus = "REACHABLE"
    } else if (status === "REACHABLE") {
      if (!anyLive) patch.leadStatus = "REVIEWED"
    } else if (status !== "REVIEWED") {
      patch.leadStatus = "REVIEWED"
    }
  }
  if (reachable && c.contactVerified !== true) patch.contactVerified = true
  if (!anyValid && hadContact && c.contactVerified !== false)
    patch.contactVerified = false
  if (site?.live) patch.lastSeenAt = new Date().toISOString()

  return {
    id: c.id,
    name: c.name ?? "",
    country: c.country ?? "",
    stage: c.stage ?? "",
    phones,
    emails,
    site,
    facebook,
    reachable,
    patch,
  }
}

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>) {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    })
  )
  return out
}

async function main(): Promise<void> {
  const limit = Number(arg("limit", "0")) || Infinity
  const { all, rest } = twentyClient()

  console.log("Reading companies …")
  const book = ((await all("companies")) as unknown as Company[])
    .filter((c) => c.country === "SD" || c.originCountry === "SD")
    // The funnel's own e2e fixtures carry placeholder numbers and a delete-me name.
    .filter((c) => !/e2e (wave )?test/i.test(c.name ?? ""))
    .slice(0, limit)
  console.log(`Sudanese book: ${book.length} schools — checking channels …`)

  let done = 0
  const verdicts = await pool(book, 12, async (c) => {
    const v = await judge(c)
    if (++done % 100 === 0) console.log(`  … ${done}/${book.length}`)
    return v
  })

  const count = (f: (v: Verdict) => boolean) => verdicts.filter(f).length
  const tally = {
    schools: verdicts.length,
    reachable: count((v) => v.reachable),
    viaMobile: count((v) => v.phones.some((p) => p.reach === "MOBILE")),
    viaEmail: count((v) => v.emails.some((e) => e.ok)),
    landlineOnly: count(
      (v) => !v.reachable && v.phones.some((p) => p.reach === "LANDLINE")
    ),
    deadEmails: verdicts.flatMap((v) => v.emails).filter((e) => !e.ok).length,
    placeholderPhones: verdicts
      .flatMap((v) => v.phones)
      .filter((p) => p.reach === "PLACEHOLDER").length,
    sitesChecked: count((v) => !!v.site),
    sitesLive: count((v) => !!v.site?.live),
    facebookOnly: count(
      (v) =>
        !v.reachable && !!v.facebook && !v.site?.live && v.phones.length === 0
    ),
    noChannel: count(
      (v) =>
        v.phones.length === 0 && v.emails.length === 0 && !v.site && !v.facebook
    ),
    writes: count((v) => Object.keys(v.patch).length > 0),
    toReachable: count((v) => v.patch.leadStatus === "REACHABLE"),
    toReviewed: count((v) => v.patch.leadStatus === "REVIEWED"),
    downgraded: verdicts.filter(
      (v) =>
        v.patch.leadStatus === "REVIEWED" &&
        book.find((c) => c.id === v.id)?.leadStatus === "REACHABLE"
    ).length,
  }

  mkdirSync("scripts/crm/.data", { recursive: true })
  const out = `scripts/crm/.data/sd-reach-${new Date().toISOString().slice(0, 10)}.json`
  writeFileSync(
    out,
    JSON.stringify({ at: new Date().toISOString(), tally, verdicts }, null, 2)
  )
  console.log("\n", tally, `\n  report → ${out}`)

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply.")
    return
  }
  let ok = 0
  for (const v of verdicts) {
    if (!Object.keys(v.patch).length) continue
    try {
      await rest("PATCH", `companies/${v.id}`, v.patch)
      ok++
      if (ok % 100 === 0) console.log(`  … wrote ${ok}/${tally.writes}`)
    } catch (e) {
      console.warn(`  ✗ ${v.name}: ${(e as Error).message}`)
    }
  }
  console.log(`Applied ${ok}/${tally.writes} updates.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
