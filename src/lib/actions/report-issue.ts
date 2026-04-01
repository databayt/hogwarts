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

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["report"],
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
}
