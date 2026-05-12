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
 */

import { RateLimitError, type ReportAdapter } from "./adapters/adapter"
import { checkCorroboration, upgradeExisting } from "./corroboration"
import { findDuplicateOnGitHub } from "./dedup"
import { createIssue, postComment } from "./github"
import { hostMatches, runHardFilters } from "./hard-filters"
import { reportSchema, type ReportInputParsed } from "./schema"
import { computeScore } from "./score"
import { classifyWithHaiku } from "./triage"
import { verifyTurnstile } from "./turnstile"
import type {
  AITriageResult,
  PipelineEvent,
  PipelineResult,
  ReporterContext,
  ReportInput,
  ScoringResult,
} from "./types"

const RECENT_WINDOW_SEC = 60

export async function runReportPipeline(
  raw: unknown,
  adapter: ReportAdapter,
  opts: { ip: string } = { ip: "0.0.0.0" }
): Promise<PipelineResult> {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  if (!token) {
    console.error(
      "[report-pipeline] GITHUB_PERSONAL_ACCESS_TOKEN not configured"
    )
    return { ok: false, error: "config" }
  }

  // 1. Schema parse — wrong shape → return ok:true (denies info to client probing)
  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    await record(
      adapter,
      parsed.data,
      null,
      "silent-reject",
      "HF1_too_short",
      "0.0.0.0"
    )
    return { ok: true, bucket: "silent-reject" }
  }
  const input = parsed.data

  // 2. Reporter context
  const reporter = await adapter.getReporter(input as ReportInput)
  const identifier =
    reporter.kind === "authenticated"
      ? `user:${reporter.userId}`
      : `ip:${reporter.ipHash}`

  // 3. Rate-limit (HF8). RateLimitError → silent-reject.
  try {
    await adapter.checkRateLimit(identifier)
  } catch (err) {
    if (err instanceof RateLimitError) {
      await record(
        adapter,
        input,
        reporter,
        "silent-reject",
        "HF8_rate_limited",
        opts.ip
      )
      return { ok: true, bucket: "silent-reject" }
    }
    throw err
  }

  // 4. Captcha — required for anonymous, optional otherwise
  let captchaValid: boolean | null = null
  if (reporter.kind === "anonymous") {
    captchaValid = await verifyTurnstile(input.captchaToken, opts.ip)
  }

  // 5. Recent self-submissions (for HF9) + banned check (HF10)
  const [recent, banned] = await Promise.all([
    adapter.getRecentSelfSubmissions(identifier, RECENT_WINDOW_SEC),
    adapter.isBanned(identifier),
  ])

  // 6. Hard filters
  const rejectReason = runHardFilters(input, reporter, {
    hostAllowlist: adapter.hostAllowlist as string[],
    recentSelfSubmissions: recent,
    captchaValid,
    isBanned: banned,
  })
  if (rejectReason) {
    await record(
      adapter,
      input,
      reporter,
      "silent-reject",
      rejectReason.code,
      opts.ip
    )
    return { ok: true, bucket: "silent-reject" }
  }

  // 7. Dedup against existing GitHub issues — if confident, +1 the existing
  const dup = await findDuplicateOnGitHub(input, {
    repo: adapter.repo,
    token,
  }).catch(() => ({ found: false as const }))
  if (dup.found) {
    await postComment({
      repo: adapter.repo,
      token,
      issueNumber: dup.issueNumber,
      body: corroborationComment(input, reporter),
    }).catch(() => {})
    // Trigger corroboration upgrade check on the existing issue
    await maybeUpgradeOnCorroboration(input, adapter, token).catch(() => {})
    await record(
      adapter,
      input,
      reporter,
      "duplicate-corroborated",
      undefined,
      opts.ip,
      undefined,
      dup.issueNumber
    )
    return { ok: true, bucket: "verified-report", issueNumber: dup.issueNumber }
  }

  // 8. AI triage (Haiku)
  const triage: AITriageResult | null = await classifyWithHaiku(input, {
    repo: adapter.repo,
    reporter,
  })

  // 9. Pattern signal inputs
  const url = new URL(input.pageUrl)
  const hostIsProd = isProductionHost(
    url.host,
    adapter.hostAllowlist as string[]
  )
  const corroborationCount =
    triage?.classification === "bug"
      ? await adapter
          .getCorroborationCount(url.host, url.pathname, 7)
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
    await record(
      adapter,
      input,
      reporter,
      "silent-reject",
      undefined,
      opts.ip,
      result.score
    )
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

  // 13. Optional auto-comment for verified-bucket — acknowledge to the user
  if (result.bucket === "verified-report") {
    await postComment({
      repo: adapter.repo,
      token,
      issueNumber: issue.issueNumber,
      body: ackComment(),
    }).catch(() => {})
  }

  // 14. If corroborationCount was already at threshold, this newly-created
  // verified-report stands on its own and the upgrade pass is a no-op.
  await record(
    adapter,
    input,
    reporter,
    result.bucket,
    undefined,
    opts.ip,
    result.score,
    issue.issueNumber,
    triage?.classification
  )

  return {
    ok: true,
    bucket: result.bucket,
    issueNumber: issue.issueNumber,
    score: result.score,
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

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
  if (result.bucket === "needs-human" && triage) {
    lines.push("", "---", "")
    lines.push(`**Classification**: ${triage.classification}`)
    if (triage.destructiveSignals.length > 0) {
      lines.push(
        `**Destructive signals**: ${triage.destructiveSignals.join(", ")}`
      )
    }
    lines.push(`**AI rationale**: ${triage.rationale}`)
    lines.push("")
    lines.push("> This issue requires human review before any automated fix.")
    lines.push(
      "> Add the `verified-report` label to manually promote into the auto-fix queue."
    )
  }

  // Score block — machine-readable footer parsed by the /report agent
  lines.push("", buildScoreBlock(result, triage))

  return lines.join("\n")
}

function buildScoreBlock(
  result: ScoringResult,
  triage: AITriageResult | null
): string {
  const payload = {
    score: result.score,
    bucket: result.bucket,
    classification: triage?.classification ?? "unknown",
    severity: triage?.severity ?? "medium",
    language: triage?.language ?? "other",
    scores: result.breakdown,
    rationale: triage?.rationale ?? "",
  }
  return `<!-- score-block\n${JSON.stringify(payload, null, 2)}\n-->`
}

function reporterLabel(reporter: ReporterContext): string {
  if (reporter.kind === "anonymous") return "Anonymous"
  return `${reporter.role} (id:${reporter.userId.slice(0, 8)}…)`
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

async function record(
  adapter: ReportAdapter,
  input: ReportInputParsed | unknown,
  reporter: ReporterContext | null,
  outcome: PipelineEvent["outcome"],
  rejectReason: PipelineEvent["rejectReason"],
  ip: string,
  score?: number,
  issueNumber?: number,
  classification?: PipelineEvent["classification"]
): Promise<void> {
  let host = ""
  let path = ""
  try {
    const u = new URL((input as ReportInputParsed)?.pageUrl ?? "")
    host = u.host
    path = u.pathname
  } catch {
    /* ignore */
  }
  const event: PipelineEvent = {
    at: new Date().toISOString(),
    repo: adapter.repo,
    outcome,
    rejectReason,
    score,
    classification,
    issueNumber,
    reporterKind: reporter?.kind ?? "anonymous",
    reporterRole:
      reporter?.kind === "authenticated" ? reporter.role : undefined,
    ipHash: reporter?.ipHash ?? "unknown",
    host,
    path,
  }
  await adapter.recordPipelineEvent(event).catch((err) => {
    console.warn("[report-pipeline] recordPipelineEvent failed:", err)
  })
}
