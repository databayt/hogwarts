// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hogwarts-specific adapter for the shared report pipeline.
 *
 * Auth: hogwarts uses `@/auth` (next-auth v5) with rich session shape
 * (id, role, schoolId, email). User roles span DEVELOPER, ADMIN, TEACHER,
 * GUARDIAN, STUDENT, ACCOUNTANT, STAFF — all mapped in ROLE_BASE in score.ts.
 *
 * Team detection — the signal the human gate sorts by. hogwarts sessions are
 * tenant users, so "team" cannot mean an email domain alone: the team tests as
 * ADMIN on databayt-owned tenants (demo) and signs in as dev@balqalam.com on
 * the platform. A reporter is team when ANY of:
 *   - role DEVELOPER
 *   - email in REPORT_TEAM_EMAILS (comma-separated) or the built-in list
 *   - email on a databayt-owned domain
 *   - signed in AND reporting from a host in REPORT_TEAM_HOSTS (demo tenant)
 *
 * Hosts: production moved to *.balqalam.com on 2026-09-08. The allowlist did
 * not follow, so HF5 silently rejected every report from the live product for
 * five days while the dialog showed "Submitted. Thank you!". Both zones stay
 * listed; a host missing here is a silent black hole.
 *
 * Captcha: hogwarts never wired Turnstile and its reporters are signed-in
 * users. `captcha: "optional"` keeps the rare anonymous marketing-page report
 * at degraded trust instead of refusing it (kun refuses — different traffic).
 *
 * Rate-limit + dedup + corroboration: Upstash REST when configured. Without
 * it the limiter fails OPEN on purpose — production has no Upstash today and a
 * refusal would only surface as "Something went wrong" for a teacher. The
 * dialog's 60s cooldown covers the triple-click case client-side.
 */

import { createHash } from "crypto"
import { headers } from "next/headers"
import { auth } from "@/auth"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import { RateLimitError, type ReportAdapter } from "./adapters/adapter"
import type { PipelineEvent, ReporterContext, ReportInput } from "./types"

// Trim env values — a stray trailing newline in GITHUB_REPO (e.g. "databayt/hogwarts\n")
// builds a malformed GitHub URL and silently breaks every report submission.
const REPO = (process.env.GITHUB_REPO || "databayt/hogwarts").trim()
const SALT = (process.env.REPORT_IP_SALT || "hogwarts-default-salt").trim()

const TEAM_EMAILS = new Set(
  [
    "dev@balqalam.com",
    "dev@databayt.org",
    ...(process.env.REPORT_TEAM_EMAILS ?? "").split(","),
  ]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
)
const TEAM_EMAIL_DOMAINS = ["@databayt.org", "@balqalam.com"]
const TEAM_HOSTS = new Set(
  [
    "demo.balqalam.com",
    "demo.databayt.org",
    ...(process.env.REPORT_TEAM_HOSTS ?? "").split(","),
  ]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
)

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

const reportLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/report",
    })
  : null

const reportTenantLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      analytics: true,
      prefix: "@upstash/ratelimit/report-tenant",
    })
  : null

export const hogwartsReportAdapter: ReportAdapter = {
  repo: REPO,
  hostAllowlist: [
    "*.balqalam.com",
    "balqalam.com",
    "*.databayt.org",
    "databayt.org",
    "ed.databayt.org",
    "localhost",
    "127.0.0.1",
  ],
  captcha: "optional",

  async getReporter(input: ReportInput): Promise<ReporterContext> {
    const ip = await getClientIpFromHeaders()
    const ipHash = hashIp(ip)

    const session = await auth().catch(() => null)
    const sessionUser = session?.user as
      | { id?: string; role?: string; email?: string | null }
      | undefined
    if (sessionUser?.id) {
      const role = sessionUser.role ?? "USER"
      return {
        kind: "authenticated",
        userId: sessionUser.id,
        role,
        emailVerified: Boolean(sessionUser.email),
        accountAgeDays: 30, // Phase 1 constant; Phase 2 reads from User.createdAt
        isSuspended: false,
        ipHash,
        isTeam: isTeamReporter(role, sessionUser.email, input.pageUrl),
      }
    }
    return { kind: "anonymous", ipHash }
  },

  async checkRateLimit(identifier: string): Promise<void> {
    if (process.env.NODE_ENV === "development" || !redis) return
    if (reportLimiter) {
      const r = await reportLimiter.limit(identifier)
      if (!r.success) throw new RateLimitError()
    }
    if (reportTenantLimiter) {
      const r = await reportTenantLimiter.limit("hogwarts")
      if (!r.success) throw new RateLimitError()
    }
  },

  async getRecentSelfSubmissions(
    identifier: string,
    withinSec: number
  ): Promise<string[]> {
    if (!redis) return []
    const key = `report:dedup:${identifier}`
    const raw = (await redis.lrange<string>(key, 0, 19).catch(() => null)) ?? []
    const cutoff = Date.now() - withinSec * 1000
    return raw
      .map((s) => {
        const idx = s.indexOf("|")
        if (idx < 0) return null
        const ts = Number(s.slice(0, idx))
        const head = s.slice(idx + 1)
        return ts >= cutoff ? head : null
      })
      .filter((v): v is string => v !== null)
  },

  async getCorroborationCount(
    host: string,
    path: string,
    withinDays: number
  ): Promise<number> {
    if (!redis) return 0
    const key = `report:page:${host}:${normalizedPath(path)}`
    const count = await redis.get<number>(key).catch(() => null)
    void withinDays
    return count == null ? 0 : Number(count)
  },

  async isBanned(identifier: string): Promise<boolean> {
    if (!redis) return false
    const banned = await redis
      .sismember("report:banned", identifier)
      .catch(() => 0)
    return banned === 1
  },

  async recordPipelineEvent(event: PipelineEvent): Promise<void> {
    console.info("[report]", JSON.stringify(event))

    if (!redis) return

    // HF9 ledger — keyed by the identifier the pipeline computed. Deriving it
    // again here is what once keyed the write on `user:<ipHash>` while the read
    // used `user:<userId>`: written, never found, dedup dead for signed-in users.
    if (
      event.dedupIdentifier &&
      event.outcome !== "silent-reject" &&
      event.outcome !== "duplicate-corroborated"
    ) {
      const key = `report:dedup:${event.dedupIdentifier}`
      const entry = `${Date.now()}|${event.path.slice(0, 60)}`
      await redis.lpush(key, entry).catch(() => {})
      await redis.ltrim(key, 0, 19).catch(() => {})
      await redis.expire(key, 60).catch(() => {})
    }

    if (event.outcome === "verified-report" && event.host && event.path) {
      const key = `report:page:${event.host}:${normalizedPath(event.path)}`
      await redis.incr(key).catch(() => {})
      await redis.expire(key, 60 * 60 * 24 * 7).catch(() => {})

      // Remember which issue covers this URL so the next report about the same
      // page corroborates it instead of opening a duplicate. findExistingForUrl
      // reads this key; nothing wrote it before 2026-09-13.
      if (event.issueNumber) {
        const issueKey = `report:issue:${event.host}:${normalizedPath(event.path)}`
        await redis
          .set(issueKey, event.issueNumber, { ex: 60 * 60 * 24 * 30 })
          .catch(() => {})
      }
    }
  },

  async findExistingForUrl(
    host: string,
    path: string
  ): Promise<{ issueNumber: number } | null> {
    if (!redis) return null
    const key = `report:issue:${host}:${normalizedPath(path)}`
    const num = await redis.get<number>(key).catch(() => null)
    return num ? { issueNumber: Number(num) } : null
  },
}

function isTeamReporter(
  role: string,
  email: string | null | undefined,
  pageUrl: string
): boolean {
  if (role.toUpperCase() === "DEVELOPER") return true
  const mail = (email ?? "").trim().toLowerCase()
  if (mail) {
    if (TEAM_EMAILS.has(mail)) return true
    if (TEAM_EMAIL_DOMAINS.some((d) => mail.endsWith(d))) return true
  }
  try {
    const host = new URL(pageUrl).host.toLowerCase()
    if (TEAM_HOSTS.has(host)) return true
  } catch {
    /* unparseable URL — HF5 rejects it later */
  }
  return false
}

async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "0.0.0.0"
  )
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${SALT}`).digest("hex").slice(0, 16)
}

function normalizedPath(path: string): string {
  const beforeQuery = path.split("?")[0] ?? path
  return beforeQuery.replace(/\/$/, "") || "/"
}

/**
 * The same adapter for a reporter the CALLER has already authenticated — the
 * mobile report route, which knows its user from a verified bearer token and
 * has no web session for `auth()` to read. Everything else (rate limits,
 * dedup, corroboration, bans, the GitHub write) is the web adapter's, so a
 * phone report goes through exactly the pipeline a browser report does, and
 * is judged as the signed-in reporter it is rather than as anonymous.
 */
export function hogwartsReportAdapterFor(user: {
  id: string
  role: string
  email: string | null
}): ReportAdapter {
  return {
    ...hogwartsReportAdapter,
    async getReporter(input: ReportInput): Promise<ReporterContext> {
      const ipHash = hashIp(await getClientIpFromHeaders())
      return {
        kind: "authenticated",
        userId: user.id,
        role: user.role,
        emailVerified: Boolean(user.email),
        accountAgeDays: 30, // Phase 1 constant, as for a browser reporter
        isSuspended: false,
        ipHash,
        isTeam: isTeamReporter(user.role, user.email, input.pageUrl),
      }
    },
  }
}
