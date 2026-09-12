# Report Pipeline — Credibility Scoring + the Human Gate

Shared intake for the "Report an Issue" feature across all databayt product repos.
Kills junk **before** a GitHub issue exists, scores what survives so the queue is
ordered, and hands the decision to a human — the `report` skill lists every open
report and Abdout takes or rejects each one. Only what he accepted (or a genuine
`verified-report`) enters the auto-fix lane.

## Contract

Each repo (hogwarts, mkan, kun) copies this directory to `src/lib/report/`
(kun is the source of truth — copy the whole directory, then keep only your own
`adapter.ts`) and writes a thin **adapter** that wires its repo-specific concerns:

- `auth()` shape and **who counts as team** (`ReporterContext.isTeam`)
- Rate-limit store (Upstash; fail closed or open is the adapter's call)
- Recent-submissions ledger (KV or DB)
- Corroboration counter (KV or DB)
- Repo path (e.g. `databayt/hogwarts`)
- Host allowlist (`*.balqalam.com`, `*.databayt.org`, `localhost`, …) — **a host
  missing here silently rejects every report from it** (hogwarts lost every report
  between the balqalam.com cutover and 2026-09-13 this way)
- Captcha policy: `"required"` (kun — refuse anonymous reports when Turnstile is
  unconfigured) or `"optional"` (hogwarts, mkan — accept at degraded trust)

## Pipeline

```
reportSchema (Zod) → reporter → PURE filters (HF1/2/5/6/7, zero I/O)
  → rate limit (HF8) → [captcha ‖ recent-self ‖ banned] → CONTEXT filters (HF10/4/3/9)
  → [GitHub dedup search ‖ AI triage] → corroboration → score → bucket
  → GitHub issue → [ack comment ‖ event record]
```

Cheap before expensive, independent in parallel. Junk costs zero network calls; a
clean report waits on four round-trip stages instead of nine. Every recorded event
carries `durationMs` and `isTeam` — `grep '\[report\]'` the logs to see where a
submission spends its time.

## Intake limits (`limits.ts` — the one place both sides read from)

| Reporter  | min chars | min unique tokens |
| --------- | --------- | ----------------- |
| anonymous | 30        | 5                 |
| signed-in | 10        | 3                 |

Max 2000 chars for everyone. The dialog mirrors these so the send button enables
exactly when the server will accept the text. Two literals used to drift: hogwarts
enabled submit on any text while the schema demanded 30 chars, so a short team
report drew "Submitted. Thank you!" and created nothing.

## Buckets — signals, not verdicts

| Score   | Bucket            | Label             | What happens                               |
| ------- | ----------------- | ----------------- | ------------------------------------------ |
| `<30`   | `silent-reject`   | —                 | No issue. UI shows the same success toast. |
| `30-54` | `low-confidence`  | `low-confidence`  | Issue created; listed last.                |
| `55-74` | `needs-human`     | `needs-human`     | Issue created; listed.                     |
| `≥75`   | `verified-report` | `verified-report` | Issue created; fair game for the agent.    |

Overrides:

- `reporter.isTeam` → R = 30, never below `needs-human`, `team` label, listed first
- `destructive` classification → forced `needs-human`
- 3 corroborations on same URL → upgrades existing issue to `verified-report`
- AI failure (the normal case — no `ANTHROPIC_API_KEY` in production under the
  subscription-only billing posture) → bucket capped at `needs-human`, floored above
  `silent-reject`
- `severityHint=critical` and score≥60 → bucket promoted to `verified-report`

The human gate adds two labels the pipeline never sets: `accepted` (Abdout took it)
and, on the agent's side, `cannot-reproduce`. Rejected reports are closed as _not
planned_ with a one-line reason.

## Files

| File                  | What                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `types.ts`            | All shared types (`ReportInput`, `ReporterContext`, `ScoringResult`, `PipelineEvent`, …) |
| `limits.ts`           | Intake floors per reporter kind — imported by the dialog AND the filters                 |
| `schema.ts`           | Zod schema (`reportSchema`, `REPORT_CATEGORIES`)                                         |
| `labels.ts`           | GitHub label specs (`REPORT_LABELS` incl. `team`, `accepted`, `cannot-reproduce`)        |
| `hard-filters.ts`     | HF1–HF10 silent-reject triggers, split into `runPureFilters` / `runContextFilters`       |
| `score.ts`            | Pure scoring function `computeScore()` with the team floor                               |
| `triage.ts`           | Claude Haiku 4.5 call with forced tool-use (only when a key exists)                      |
| `dedup.ts`            | Jaccard-similarity duplicate detection — description vs description                      |
| `corroboration.ts`    | 3-reporter upgrade check                                                                 |
| `turnstile.ts`        | Cloudflare captcha verification                                                          |
| `github.ts`           | GitHub REST helpers (createIssue, addLabels, search)                                     |
| `pipeline.ts`         | Orchestrator — `runReportPipeline()`                                                     |
| `adapters/adapter.ts` | `ReportAdapter` interface (incl. `captcha` policy)                                       |
| `adapter.ts`          | THIS repo's adapter — the only file that differs per repo                                |
| `index.ts`            | Public surface                                                                           |
| `__tests__/`          | `score.test.ts`, `pipeline.test.ts` (fake adapter + stubbed GitHub), `dedup.test.ts`     |

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
GITHUB_PERSONAL_ACCESS_TOKEN  # PAT with issues:write on the repo — without it every submission fails
GITHUB_REPO                    # e.g. databayt/hogwarts (or default in adapter)
UPSTASH_REDIS_REST_URL         # rate-limit + recent ledger (kun: required in production)
UPSTASH_REDIS_REST_TOKEN
TURNSTILE_SECRET_KEY           # captcha for anonymous submissions (kun: required in production)
NEXT_PUBLIC_TURNSTILE_SITE_KEY # client-side widget
ANTHROPIC_API_KEY              # optional — AI triage runs only when present (API spend)
```

## Tests

```
pnpm vitest run src/lib/report
```

## See also

- Skill: `/Users/abdout/kun/.claude/skills/report/SKILL.md` — list → choose → apply → fix
- Agent: `/Users/abdout/kun/.claude/agents/report.md` — the fix lane
- Session hook: `/Users/abdout/kun/.claude/scripts/hooks/session-start-reports.sh` — one search call, lists the queue
- Rule: `/Users/abdout/kun/.claude/rules-global/session-start.md` — the hook lists, the human chooses
- Docs: `content/docs/issue.mdx`
