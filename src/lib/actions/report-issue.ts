"use server"

export async function reportIssue(data: {
  description: string
  pageUrl: string
}) {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  const repo = process.env.GITHUB_REPO || "databayt/hogwarts"

  if (!token) throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN not configured")

  const title =
    data.description.length > 80
      ? data.description.slice(0, 77) + "..."
      : data.description

  const body = [
    data.description,
    "",
    "---",
    "",
    `**Page**: \`${data.pageUrl}\``,
    `**Time**: ${new Date().toISOString()}`,
  ].join("\n")

  // Try with label first, fall back without if label doesn't exist
  const payload: Record<string, unknown> = { title, body, labels: ["report"] }

  let response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(payload),
  })

  // If 422 (label doesn't exist), retry without labels
  if (response.status === 422) {
    delete payload.labels
    response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify(payload),
    })
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    console.error(`[report-issue] GitHub API ${response.status}: ${text}`)
    throw new Error(`GitHub API error: ${response.status}`)
  }
}
