// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pipeline orchestrator — wires schema, adapter, hard-filters, captcha, dedup,
 * triage, score, GitHub.
 *
 * Caller (repo's server action) does:
 *
 *   const result = await runReportPipeline(rawInput, adapter);
 *   // result.ok is always true unless something unrecoverable broke.
 *
 * The pipeline returns symmetric success (plan §10): the client UI shows the
 * same "Submitted, thank you" message whether we created an issue or silently
 * rejected. Only verified-bucket results expose an issueNumber.
 *
 * Order of operations (2026-09-13 — cheap before expensive, independent in
 * parallel):
 *
 *   schema → reporter → PURE filters (HF1/2/5/6/7, zero I/O)
 *     → rate limit (HF8)
 *     → [captcha ‖ recent-self ‖ banned] → CONTEXT filters (HF10/4/3/9)
 *     → [GitHub dedup search ‖ AI triage]
 *     → corroboration count → score → create issue → [ack comment ‖ record]
 *
 * Junk now costs zero network calls, and a clean report waits on four
 * round-trip stages instead of nine. Every event carries `durationMs`.
 */

import { RateLimitError, type ReportAdapter } from "./adapters/adapter"
import { checkCorroboration, upgradeExisting } from "./corroboration"
import { findDuplicateOnGitHub } from "./dedup"
import { createIssue, postComment } from "./github"
import { hostMatches, runContextFilters, runPureFilters } from "./hard-filters"
import { reportSchema, type ReportInputParsed } from "./schema"
import { computeScore } from "./score"
import { classifyWithHaiku } from "./triage"
import { isTurnstileConfigured, verifyTurnstile } from "./turnstile"
import type {
  AITriageResult,
  PipelineEvent,
  PipelineResult,
  ReporterContext,
  ReportInput,
  ScoringResult,
} from "./types"

const RECENT_WINDOW_SEC = 60

interface RunContext {
  adapter: ReportAdapter
  ip: string
  startedAt: number
}

export async function runReportPipeline(
  raw: unknown,
  adapter: ReportAdapter,
  opts: { ip: string } = { ip: "0.0.0.0" }
): Promise<PipelineResult> {
  const run: RunContext = { adapter, ip: opts.ip, startedAt: Date.now() }

  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN?.trim()
  if (!token) {
    console.error(
      "[report-pipeline] GITHUB_PERSONAL_ACCESS_TOKEN not configured"
    )
    return { ok: false, error: "config" }
  }

  // 1. Schema parse — wrong shape → return ok:true (denies info to client probing)
  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    await record(run, {
      input: raw,
      reporter: null,
      outcome: "silent-reject",
      rejectReason: "HF1_too_short",
    })
    return { ok: true, bucket: "silent-reject" }
  }
  const input = parsed.data

  // 2. Reporter context — a session read; needed before the pure filters
  //    because the HF1/HF6 floors depend on anonymous vs signed-in.
  const reporter = await adapter.getReporter(input as ReportInput)
  const identifier = dedupIdentifier(reporter)

  // 3. Pure filters — HF1/2/5/6/7 need only the payload. Junk stops here,
  //    before rate-limit, captcha and Redis spend a round-trip on it.
  const pureReject = runPureFilters(input, reporter, adapter.hostAllowlist)
  if (pureReject) {
    await record(run, {
      input,
      reporter,
      outcome: "silent-reject",
      rejectReason: pureReject.code,
    })
    return { ok: true, bucket: "silent-reject" }
  }

  // 4. Rate-limit (HF8). RateLimitError → silent-reject. Any other error is a
  //    misconfiguration the adapter chose to fail closed on — let it surface.
  try {
    await adapter.checkRateLimit(identifier)
  } catch (err) {
    if (err instanceof RateLimitError) {
      await record(run, {
        input,
        reporter,
        outcome: "silent-reject",
        rejectReason: "HF8_rate_limited",
      })
      return { ok: true, bucket: "silent-reject" }
    }
    throw err
  }

  // 5. Captcha verdict and the two Redis ledgers are independent — one wait.
  const [captchaValid, recent, banned] = await Promise.all([
    resolveCaptcha(reporter, input, adapter, opts.ip),
    adapter.getRecentSelfSubmissions(identifier, RECENT_WINDOW_SEC),
    adapter.isBanned(identifier),
  ])

  // 6. Context filters — HF10/HF4 (identity) then HF3/HF9 (history)
  const ctxReject = runContextFilters(
    reporter,
    {
      captchaValid,
      isBanned: banned,
      recentSelfSubmissions: recent,
      description: input.description,
    },
    "all"
  )
  if (ctxReject) {
    await record(run, {
      input,
      reporter,
      outcome: "silent-reject",
      rejectReason: ctxReject.code,
    })
    return { ok: true, bucket: "silent-reject" }
  }

  // 7 + 8. GitHub dedup search and AI triage never depend on each other; run
  //    them together. Triage is a no-op without ANTHROPIC_API_KEY (returns null).
  const [dup, triage] = await Promise.all([
    findDuplicateOnGitHub(input, { repo: adapter.repo, token }).catch(() => ({
      found: false as const,
    })),
    classifyWithHaiku(input, { repo: adapter.repo, reporter }),
  ])

  if (dup.found) {
    await Promise.all([
      postComment({
        repo: adapter.repo,
        token,
        issueNumber: dup.issueNumber,
        body: corroborationComment(input, reporter),
      }).catch(() => {}),
      // Trigger corroboration upgrade check on the existing issue
      maybeUpgradeOnCorroboration(input, adapter, token).catch(() => {}),
    ])
    await record(run, {
      input,
      reporter,
      outcome: "duplicate-corroborated",
      issueNumber: dup.issueNumber,
    })
    return {
      ok: true,
      bucket: "verified-report",
      issueNumber: dup.issueNumber,
    }
  }

  // 9. Pattern signal inputs
  const url = new URL(input.pageUrl)
  const hostIsProd = isProductionHost(
    url.hostname,
    adapter.hostAllowlist as string[]
  )
  const corroborationCount =
    triage?.classification === "bug"
      ? await adapter
          .getCorroborationCount(url.hostname, url.pathname, 7)
          .catch(() => 0)
      : 0
  // ipDailyNoise is Phase 2; default to 0 in Phase 1.
  const ipDailyNoise = 0

  // 10. Score and bucket
  const result: ScoringResult = computeScore(input, {
    reporter,
    triage,
    corroborationCount,
    ipDailyNoise,
    hostIsProd,
  })

  // 11. Silent-reject — no issue created
  if (result.bucket === "silent-reject") {
    await record(run, {
      input,
      reporter,
      outcome: "silent-reject",
      score: result.score,
    })
    return { ok: true, bucket: "silent-reject" }
  }

  // 12. Create the GitHub issue
  const issue = await createIssue({
    repo: adapter.repo,
    token,
    title: buildTitle(input),
    body: buildBody(input, reporter, triage, result),
    labels: result.labels,
  }).catch((err) => {
    console.error("[report-pipeline] createIssue failed:", err)
    return null
  })

  if (!issue) {
    return { ok: false, error: "internal" }
  }

  // 13 + 14. The verified-bucket acknowledgement and the event write are
  //    independent side effects — one wait, then return.
  await Promise.all([
    result.bucket === "verified-report"
      ? postComment({
          repo: adapter.repo,
          token,
          issueNumber: issue.issueNumber,
          body: ackComment(),
        }).catch(() => {})
      : Promise.resolve(),
    record(run, {
      input,
      reporter,
      outcome: result.bucket,
      score: result.score,
      issueNumber: issue.issueNumber,
      classification: triage?.classification,
    }),
  ])

  return {
    ok: true,
    bucket: result.bucket,
    issueNumber: issue.issueNumber,
    score: result.score,
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

/**
 * Captcha verdict for this reporter:
 *   authenticated → null (auth is the trust signal)
 *   anonymous + Turnstile configured → verified true/false
 *   anonymous + not configured, development → null (local bypass)
 *   anonymous + not configured, adapter.captcha "optional" → null (degraded trust)
 *   anonymous + not configured, adapter.captcha "required" → throw (fail closed)
 *
 * The last line is the 2026-07-26 decision for kun: treating "unconfigured"
 * as "skip the captcha" turned the anonymous intake into an open endpoint
 * while every dashboard still showed the pipeline as healthy.
 */
async function resolveCaptcha(
  reporter: ReporterContext,
  input: ReportInputParsed,
  adapter: ReportAdapter,
  ip: string
): Promise<boolean | null> {
  if (reporter.kind !== "anonymous") return null
  if (isTurnstileConfigured()) {
    return verifyTurnstile(input.captchaToken, ip)
  }
  if (process.env.NODE_ENV === "development") return null
  if ((adapter.captcha ?? "required") === "optional") return null
  throw new Error(
    "Captcha is not configured (TURNSTILE_SECRET_KEY). Refusing anonymous reports rather than accepting them unverified."
  )
}

function isProductionHost(host: string, allowlist: readonly string[]): boolean {
  // Prod = matches allowlist AND is not localhost/127.*/::1
  if (/^localhost(?::\d+)?$/i.test(host)) return false
  if (/^127\./.test(host)) return false
  if (host === "::1") return false
  return hostMatches(host, allowlist)
}

function buildTitle(input: ReportInputParsed): string {
  const prefix = input.category !== "other" ? `[${input.category}] ` : ""
  const desc = input.description.trim()
  const maxLen = 80 - prefix.length
  const truncated =
    desc.length > maxLen ? desc.slice(0, maxLen - 3) + "..." : desc
  return prefix + truncated
}

function buildBody(
  input: ReportInputParsed,
  reporter: ReporterContext,
  triage: AITriageResult | null,
  result: ScoringResult
): string {
  const lines: string[] = [
    input.description,
    "",
    "---",
    "",
    `**Page**: \`${input.pageUrl}\``,
    `**Reporter**: ${reporterLabel(reporter)}`,
    `**Time**: ${new Date().toISOString()}`,
    `**Category**: ${input.category}`,
  ]

  if (input.viewport) lines.push(`**Viewport**: ${input.viewport}`)
  if (input.direction) lines.push(`**Direction**: ${input.direction}`)
  if (input.browser) lines.push(`**Browser**: ${input.browser}`)

  if (input.reproSteps?.trim()) {
    lines.push("", "**Steps to reproduce**:", input.reproSteps.trim())
  }
  if (input.expected?.trim()) {
    lines.push("", "**Expected**:", input.expected.trim())
  }
  if (input.actual?.trim()) {
    lines.push("", "**Actual**:", input.actual.trim())
  }

  // needs-human bucket needs the rationale visible above the fold
  if (result.bucket === "needs-human") {
    lines.push("", "---", "")
    if (triage) {
      lines.push(`**Classification**: ${triage.classification}`)
      if (triage.destructiveSignals.length > 0) {
        lines.push(
          `**Destructive signals**: ${triage.destructiveSignals.join(", ")}`
        )
      }
      lines.push(`**AI rationale**: ${triage.rationale}`)
    } else {
      lines.push(
        "**AI triage**: unavailable — scored on reporter, content and context signals only."
      )
    }
    lines.push("")
    lines.push(
      "> Waiting for the human gate: `report` lists this with the other open reports; take it or reject it there."
    )
  }

  // Score block — machine-readable footer parsed by the /report agent
  lines.push("", buildScoreBlock(reporter, result, triage))

  return lines.join("\n")
}

function buildScoreBlock(
  reporter: ReporterContext,
  result: ScoringResult,
  triage: AITriageResult | null
): string {
  const payload = {
    score: result.score,
    bucket: result.bucket,
    team: isTeamReporter(reporter),
    reporterKind: reporter.kind,
    classification: triage?.classification ?? "unknown",
    severity: triage?.severity ?? "medium",
    language: triage?.language ?? "other",
    scores: result.breakdown,
    rationale: triage?.rationale ?? "",
  }
  return `<!-- score-block\n${JSON.stringify(payload, null, 2)}\n-->`
}

function isTeamReporter(reporter: ReporterContext | null): boolean {
  return reporter?.kind === "authenticated" && reporter.isTeam === true
}

function reporterLabel(reporter: ReporterContext): string {
  if (reporter.kind === "anonymous") return "Anonymous"
  const who = `${reporter.role} (id:${reporter.userId.slice(0, 8)}…)`
  return reporter.isTeam ? `team · ${who}` : who
}

function corroborationComment(
  input: ReportInputParsed,
  reporter: ReporterContext
): string {
  return [
    "+1 corroborated by another reporter",
    "",
    "<details>",
    "<summary>New report on this page</summary>",
    "",
    input.description,
    "",
    "---",
    `Reporter: ${reporterLabel(reporter)}`,
    `Time: ${new Date().toISOString()}`,
    "</details>",
  ].join("\n")
}

function ackComment(): string {
  return "Received. This report passed automated triage and is queued for fix. You'll be notified here when resolved."
}

async function maybeUpgradeOnCorroboration(
  input: ReportInputParsed,
  adapter: ReportAdapter,
  token: string
): Promise<void> {
  const check = await checkCorroboration(input.pageUrl, adapter)
  if (check.shouldUpgrade && check.existingIssue) {
    await upgradeExisting(check.existingIssue, { repo: adapter.repo, token })
  }
}

/**
 * The identity a reporter is rate-limited and deduped against.
 *
 * The single definition on purpose — read and write paths derived this
 * separately and disagreed, which silently disabled HF9 dedup for
 * authenticated reporters.
 */
function dedupIdentifier(reporter: ReporterContext): string {
  return reporter.kind === "authenticated"
    ? `user:${reporter.userId}`
    : `ip:${reporter.ipHash}`
}

interface RecordArgs {
  input: unknown
  reporter: ReporterContext | null
  outcome: PipelineEvent["outcome"]
  rejectReason?: PipelineEvent["rejectReason"]
  score?: number
  issueNumber?: number
  classification?: PipelineEvent["classification"]
}

async function record(run: RunContext, args: RecordArgs): Promise<void> {
  let host = ""
  let path = ""
  try {
    const u = new URL((args.input as ReportInputParsed)?.pageUrl ?? "")
    host = u.hostname
    path = u.pathname
  } catch {
    /* ignore */
  }
  const { reporter } = args
  const event: PipelineEvent = {
    at: new Date().toISOString(),
    repo: run.adapter.repo,
    outcome: args.outcome,
    rejectReason: args.rejectReason,
    score: args.score,
    classification: args.classification,
    issueNumber: args.issueNumber,
    reporterKind: reporter?.kind ?? "anonymous",
    reporterRole:
      reporter?.kind === "authenticated" ? reporter.role : undefined,
    isTeam: isTeamReporter(reporter),
    ipHash: reporter?.ipHash ?? "unknown",
    host,
    path,
    dedupIdentifier: reporter ? dedupIdentifier(reporter) : undefined,
    durationMs: Date.now() - run.startedAt,
  }
  await run.adapter.recordPipelineEvent(event).catch((err) => {
    console.warn("[report-pipeline] recordPipelineEvent failed:", err)
  })
}
