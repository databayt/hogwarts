# Report Pipeline — Credibility Scoring

Shared scoring infrastructure for the "Report an Issue" feature across all
databayt product repos. Filters out nonsense and destructive submissions
**before** they reach the auto-fix queue, while respecting wisdom-of-the-crowd
corroboration signals.

## Contract

Each repo (hogwarts, mkan, kun) copies this directory to `src/lib/report/`
and writes a thin **adapter** that wires its repo-specific concerns:

- `auth()` shape
- Rate-limit store (Upstash; mkan already has the pattern)
- Recent-submissions ledger (KV or DB)
- Corroboration counter (KV or DB)
- Repo path (e.g. `databayt/hogwarts`)
- Host allowlist (`*.databayt.org`, `localhost`, etc.)

## Pipeline

```
reportSchema (Zod) → reporter → hard-filters → captcha →
  dedup → AI triage (Haiku) → score → bucket → GitHub issue
```

## Buckets (strict thresholds)

| Score   | Bucket            | Action                                                       |
| ------- | ----------------- | ------------------------------------------------------------ |
| `<30`   | `silent-reject`   | No issue created. UI returns success.                        |
| `30-54` | `low-confidence`  | Issue + `low-confidence` label. Agent skips. 14d auto-close. |
| `55-74` | `needs-human`     | Issue + `needs-human` label. Human review.                   |
| `≥75`   | `verified-report` | Issue + `verified-report` label. Agent auto-fixes.           |

Overrides:

- `destructive` classification → forced `needs-human`
- 3 corroborations on same URL → upgrades existing issue to `verified-report`
- AI failure → bucket capped at `needs-human`
- `severityHint=critical` and score≥60 → bucket promoted to `verified-report`

## Files

| File                  | What                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| `types.ts`            | All shared types (`ReportInput`, `ReporterContext`, `ScoringResult`, …) |
| `schema.ts`           | Zod schema (`reportSchema`, `REPORT_CATEGORIES`)                        |
| `labels.ts`           | GitHub label specs (`REPORT_LABELS`, severity/language helpers)         |
| `hard-filters.ts`     | HF1–HF10 silent-reject triggers                                         |
| `score.ts`            | Pure scoring function `computeScore()`                                  |
| `triage.ts`           | Claude Haiku 4.5 call with forced tool-use                              |
| `dedup.ts`            | Jaccard-similarity duplicate detection                                  |
| `corroboration.ts`    | 3-reporter upgrade check                                                |
| `turnstile.ts`        | Cloudflare captcha verification                                         |
| `github.ts`           | GitHub REST helpers (createIssue, addLabels, search)                    |
| `pipeline.ts`         | Orchestrator — `runReportPipeline()`                                    |
| `adapters/adapter.ts` | `ReportAdapter` interface                                               |
| `index.ts`            | Public surface                                                          |

## Usage from a server action

```ts
"use server"

import { headers } from "next/headers"

import { runReportPipeline } from "@/lib/report"
import { hogwartsAdapter } from "@/lib/report/adapter"

export async function reportIssue(raw: unknown) {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "0.0.0.0"
  return await runReportPipeline(raw, hogwartsAdapter, { ip })
}
```

The pipeline always returns symmetric success to the caller. The UI shows the
same "Submitted, thank you" toast for silent-reject and verified-report. Only
verified-bucket results include an `issueNumber` field.

## Required env

```
GITHUB_PERSONAL_ACCESS_TOKEN  # PAT with issues:write on the repo
GITHUB_REPO                    # e.g. databayt/hogwarts (or default in adapter)
ANTHROPIC_API_KEY              # Haiku 4.5 access
UPSTASH_REDIS_REST_URL         # rate-limit + recent ledger
UPSTASH_REDIS_REST_TOKEN
TURNSTILE_SECRET_KEY           # captcha for anonymous submissions
NEXT_PUBLIC_TURNSTILE_SITE_KEY # client-side widget
```

## See also

- Plan: `/Users/abdout/.claude/plans/read-report-an-issue-glistening-wave.md`
- Agent: `/Users/abdout/kun/.claude/agents/report.md` — bucket-aware VALIDATE
- Session hook: `/Users/abdout/.claude/settings.json` — surfaces only `verified-report`
