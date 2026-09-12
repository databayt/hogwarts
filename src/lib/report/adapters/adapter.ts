// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Adapter contract — every product repo writes one of these to wire its own
 * auth, rate-limit, and history into the shared pipeline.
 *
 * Repos as of Phase 1:
 *   hogwarts → @/auth + Upstash (DB-less for this phase)
 *   mkan     → @/lib/auth + Upstash
 *   kun      → no auth, Upstash-only, captcha always required
 */

import type { PipelineEvent, ReporterContext, ReportInput } from "../types"

export interface ReportAdapter {
  /** GitHub repo path, e.g. "databayt/hogwarts". */
  readonly repo: string

  /** Host allowlist for HF5. Entries: exact ("localhost") or "*.suffix" wildcards. */
  readonly hostAllowlist: readonly string[]

  /**
   * What an anonymous report means when Turnstile is NOT configured, outside
   * development:
   *
   *   "required" (default) — refuse it. One missing env var must not turn the
   *     anonymous intake into an open endpoint while every dashboard still
   *     shows the pipeline healthy (kun, 2026-07-26 decision).
   *   "optional" — accept it at degraded trust (captchaValid = null, low
   *     reputation, lands as low-confidence for the human gate). For repos
   *     whose reporters are signed-in users and which never wired Turnstile
   *     (hogwarts, mkan) — a refusal there would only produce "Something went
   *     wrong" for the rare anonymous visitor.
   *
   * When Turnstile IS configured the policy is irrelevant: the token is
   * verified and HF3 rejects a failed check either way.
   */
  readonly captcha?: "required" | "optional"

  /**
   * Resolve the current request's reporter. Anonymous result is acceptable
   * (will be subject to captcha + low base reputation).
   */
  getReporter(req: ReportInput): Promise<ReporterContext>

  /**
   * Apply rate-limiting. Throws RateLimitError on breach; the pipeline
   * catches it and returns a silent-reject (HF8).
   */
  checkRateLimit(identifier: string): Promise<void>

  /**
   * Return any first-60-char heads from this reporter's submissions in the
   * last {withinSec} seconds. Used by HF9 to catch triple-click duplicates.
   */
  getRecentSelfSubmissions(
    identifier: string,
    withinSec: number
  ): Promise<string[]>

  /**
   * Count *verified-report* issues for this page (host + path, query stripped)
   * from independent reporters in the last {withinDays} days. Used by signal P
   * for wisdom-of-the-crowd corroboration.
   */
  getCorroborationCount(
    host: string,
    path: string,
    withinDays: number
  ): Promise<number>

  /** True if the identifier is on the permanent ban list (HF10). */
  isBanned(identifier: string): Promise<boolean>

  /**
   * Persist a pipeline event. Phase 1: log to console + Upstash. Phase 2:
   * write to the Report Prisma model.
   */
  recordPipelineEvent(event: PipelineEvent): Promise<void>

  /**
   * Look up the existing verified report for this URL, if any, so that on the
   * 3rd corroboration we can find and label the original issue.
   */
  findExistingForUrl(
    host: string,
    path: string
  ): Promise<{ issueNumber: number } | null>
}

export class RateLimitError extends Error {
  constructor(message = "Report rate limit exceeded") {
    super(message)
    this.name = "RateLimitError"
  }
}
