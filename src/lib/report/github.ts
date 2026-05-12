/**
 * GitHub REST helpers — create issue, add comment, ensure labels, search.
 *
 * Uses the GitHub Personal Access Token from env. Each repo has its own
 * token configured at deploy time; the same token authors the issue.
 */

import { ALL_REPORT_LABELS, type LabelSpec } from "./labels";

const API = "https://api.github.com";

interface GitHubAuth {
  repo: string; // "databayt/hogwarts"
  token: string;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export interface CreateIssueArgs extends GitHubAuth {
  title: string;
  body: string;
  labels: string[];
}

export interface CreateIssueResult {
  issueNumber: number;
  htmlUrl: string;
  commentsUrl: string;
}

/**
 * Create an issue, self-healing missing labels on 422. Generalizes the existing
 * kun pattern (kun/src/actions/report-issue.ts:49-65) to handle all label specs.
 */
export async function createIssue(args: CreateIssueArgs): Promise<CreateIssueResult> {
  const headers = authHeaders(args.token);
  const payload = {
    title: args.title.slice(0, 256),
    body: args.body,
    labels: args.labels,
  };

  let res = await fetch(`${API}/repos/${args.repo}/issues`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 422) {
    // Labels likely missing — ensure all known labels exist, then retry once.
    await ensureLabels({ repo: args.repo, token: args.token });
    res = await fetch(`${API}/repos/${args.repo}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub createIssue ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    number: number;
    html_url: string;
    comments_url: string;
  };
  return {
    issueNumber: data.number,
    htmlUrl: data.html_url,
    commentsUrl: data.comments_url,
  };
}

/**
 * POST a comment to an existing issue. Fire-and-forget OK — caller wraps
 * with .catch() to absorb network noise.
 */
export async function postComment(
  args: GitHubAuth & { issueNumber: number; body: string }
): Promise<void> {
  const res = await fetch(
    `${API}/repos/${args.repo}/issues/${args.issueNumber}/comments`,
    {
      method: "POST",
      headers: authHeaders(args.token),
      body: JSON.stringify({ body: args.body }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub postComment ${res.status}: ${text}`);
  }
}

/**
 * Add a label to an existing issue (no replace, additive). Used when a
 * corroboration count reaches 3 and we want to upgrade an existing issue
 * from low-confidence/needs-human to verified-report.
 */
export async function addLabels(
  args: GitHubAuth & { issueNumber: number; labels: string[] }
): Promise<void> {
  const res = await fetch(
    `${API}/repos/${args.repo}/issues/${args.issueNumber}/labels`,
    {
      method: "POST",
      headers: authHeaders(args.token),
      body: JSON.stringify({ labels: args.labels }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub addLabels ${res.status}: ${text}`);
  }
}

/**
 * Create all known labels in the repo (idempotent — 422 means "already exists").
 */
export async function ensureLabels(args: GitHubAuth): Promise<void> {
  const headers = authHeaders(args.token);
  await Promise.all(
    ALL_REPORT_LABELS.map((spec) => createOneLabel(args.repo, headers, spec))
  );
}

async function createOneLabel(
  repo: string,
  headers: HeadersInit,
  spec: LabelSpec
): Promise<void> {
  await fetch(`${API}/repos/${repo}/labels`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: spec.name,
      color: spec.color,
      description: spec.description,
    }),
  }).catch(() => {});
}

export interface IssueSearchHit {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  htmlUrl: string;
}

/**
 * Search issues by query. Returns at most {limit} hits. Used by dedup to find
 * possible duplicate reports for the same page.
 */
export async function searchIssues(
  args: GitHubAuth & { query: string; limit?: number }
): Promise<IssueSearchHit[]> {
  const q = encodeURIComponent(`repo:${args.repo} is:issue ${args.query}`);
  const res = await fetch(`${API}/search/issues?q=${q}&per_page=${args.limit ?? 5}`, {
    headers: authHeaders(args.token),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items?: Array<{
      number: number;
      title: string;
      body: string;
      state: "open" | "closed";
      labels: Array<{ name: string }>;
      html_url: string;
    }>;
  };
  return (data.items ?? []).map((i) => ({
    number: i.number,
    title: i.title,
    body: i.body ?? "",
    state: i.state,
    labels: i.labels.map((l) => l.name),
    htmlUrl: i.html_url,
  }));
}
