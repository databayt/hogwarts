// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
"use server"

/**
 * Report-issue server action — bare-fetch shim during Phase 1a rollout.
 *
 * The new scoring pipeline lives at /Users/abdout/hogwarts/src/lib/report/
 * and is fully wired in the canonical client at
 * /Users/abdout/hogwarts/src/components/report-issue/dialog.tsx, but production
 * env vars (ANTHROPIC_API_KEY, TURNSTILE_*, REPORT_IP_SALT) aren't configured
 * yet. Until they are, this action keeps the original bare-GitHub-POST behavior
 * so the dialog stays functional.
 *
 * The follow-up PR replaces this body with:
 *
 *     const { runReportPipeline } = await import("@/lib/report");
 *     const { hogwartsReportAdapter } = await import("@/lib/report/adapter");
 *     return runReportPipeline(data, hogwartsReportAdapter, { ip });
 *
 * Once Vercel env is configured. The signature already matches the new client.
 */
import { auth } from "@/auth"

import type {
  ReportIssueSubmitInput,
  ReportIssueSubmitResult,
} from "@/components/report-issue/dialog"

export async function reportIssue(
  data: ReportIssueSubmitInput
): Promise<ReportIssueSubmitResult> {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  const repo = process.env.GITHUB_REPO || "databayt/hogwarts"

  if (!token) {
    console.error("[report-issue] GITHUB_PERSONAL_ACCESS_TOKEN not configured")
    return { ok: false }
  }

  // Category prefix in title: [visual] page layout
  const prefix =
    data.category && data.category !== "other" ? `[${data.category}] ` : ""
  const desc = data.description
  const maxLen = 80 - prefix.length
  const truncated =
    desc.length > maxLen ? desc.slice(0, maxLen - 3) + "..." : desc
  const title = prefix + truncated

  // Reporter from auth session — minimum signal the legacy action lost.
  const session = await auth().catch(() => null)
  const sessionUser = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined
  const reporter = sessionUser
    ? `${sessionUser.name ?? "(no name)"} (${sessionUser.email ?? "no email"})`
    : "Anonymous"

  const body = [
    data.description,
    "",
    "---",
    "",
    `**Page**: ${data.pageUrl}`,
    `**Reporter**: ${reporter}`,
    `**Time**: ${new Date().toISOString()}`,
    data.category ? `**Category**: ${data.category}` : "",
    data.viewport ? `**Viewport**: ${data.viewport}` : "",
    data.direction ? `**Direction**: ${data.direction}` : "",
    data.browser ? `**Browser**: ${data.browser}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n")

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ title, body, labels: ["report"] }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    console.error(`[report-issue] GitHub API ${response.status}: ${text}`)
    return { ok: false }
  }

  // Acknowledgment comment (fire-and-forget)
  const issueData = (await response.json().catch(() => null)) as {
    number?: number
    comments_url?: string
  } | null
  const issueNumber = issueData?.number
  if (issueData?.comments_url) {
    fetch(issueData.comments_url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        body: "Received. This report is queued for automated review and fix. You'll be notified here when resolved.",
      }),
    }).catch(() => {})
  }

  return issueNumber ? { ok: true, issueNumber } : { ok: true }
}
