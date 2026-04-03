"use server"

import { auth } from "@/auth"

export async function reportIssue(data: {
  description: string
  pageUrl: string
  category?: string
  viewport?: string
  direction?: string
  browser?: string
}) {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  const repo = process.env.GITHUB_REPO || "databayt/hogwarts"

  if (!token) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not configured")

  // Category prefix in title: [visual] page layout
  const prefix =
    data.category && data.category !== "other" ? `[${data.category}] ` : ""
  const desc = data.description
  const maxLen = 80 - prefix.length
  const truncated =
    desc.length > maxLen ? desc.slice(0, maxLen - 3) + "..." : desc
  const title = prefix + truncated

  // Reporter from auth session
  const session = await auth().catch(() => null)
  const reporter = session?.user
    ? `${session.user.name} (${session.user.email})`
    : "Anonymous"

  const body = [
    data.description,
    "",
    "---",
    "",
    `**Page**: ${data.pageUrl}`,
    `**Time**: ${new Date().toISOString()}`,
  ].join("\n")

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
    throw new Error(`GitHub API error: ${response.status}`)
  }

  // Acknowledgment comment (fire-and-forget)
  const issueData = await response.json().catch(() => null)
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
}
