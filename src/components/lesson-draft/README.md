# lesson-draft

On a teacher's request — never automatically, never published without the teacher — produce a
**draft quick check** (6 questions) and a **draft homework** for a live class from the textbook
lesson of that class. The teacher reviews, edits and publishes. Students see nothing until then.
Tracking: databayt/hogwarts#490, package D.

The whole feature ships **off**: `LESSON_DRAFT_ENABLED` unset means no button, a 404 from the
route, and `generateLessonDrafts` throws `LESSON_DRAFT_DISABLED` before any client is built.

## Flow

```
class page ── lesson picker ── «اقترح اختباراً وواجباً» ──► POST /api/live/lesson-draft (SSE)
wizard (details step) ── «اقترح من الدرس» ──► same route, { assignmentId, homeworkOnly: true }
```

`generateLessonDrafts(actor, input, onStage)` in order:
gates (flag, role in the quick-check author roles, host seat for a class) → scope
(`resolveTeachingScope`, lesson via `verifyLessonAnchor`) → lesson text (`getLessonText`) or the
teacher's topic → idempotency (second tap) → `spend.reserve` → Claude → `validateDraft` →
`persistDraft` → `spend.settle` (always logs usage, even on failure).

## Files

| File | Role |
| --- | --- |
| `claude.ts` | `lessonDraftEnabled()`, one forced-tool `messages.create`, retry once if < 4 questions |
| `schema.ts` | the hand-written JSON schema (with enums) and the zod twin |
| `validate.ts` | pure: 4 distinct options + one correct, T/F = 2, dedupe, Arabic ratio >= 0.7 |
| `prompt.ts` | system + user prompt; lesson text fenced as untrusted data |
| `spend.ts` | the lane's cap/ledger; per-teacher daily runs |
| `lesson-text.ts` | `getLessonText`, page range, flatten, 36,000-char cap at a page boundary |
| `suggest.ts` | which lesson a class teaches next (plain server module, takes `schoolId`) |
| `generate.ts` | the core above |
| `persist.ts` | one transaction, `schoolId` on every write |
| `client.ts` | browser side of the SSE route (client-safe) |
| `types.ts` | codes, input/result types |

## Model

Claude Haiku 5.5 on the chatbot's key (`CHATBOT_ANTHROPIC_API_KEY`, model `CHATBOT_CLAUDE_MODEL`).
Never the plain `ANTHROPIC_API_KEY`. Thinking disabled, no sampling parameters, `max_tokens` 3000,
45 s a call. The answer is a **forced tool call** (`submit_draft`) validated with zod in code: the
SDK's `zodOutputFormat` silently drops `enum`.

## The `ai-draft` sentinel

New AI questions are written to `QuestionBank` with `wizardStep: "ai-draft"` (and `source: "AI"`,
tag `ai-draft`). The shared bank list filters `wizardStep: null`, so unreviewed questions stay out
of it. `launchQuickAssessment` sets `wizardStep` to null for the quick check's questions when the
teacher publishes. `deleteQuickAssessment`, a removed question in `updateQuickAssessment`, and
`replace` delete the still-hidden ones. No DDL: the sentinel reuses an existing column.

Readers of `questionBank` and whether they see `ai-draft` rows: see the hand-over report.

## Provenance and idempotency

`persistDraft` writes a `ConferenceEvent` `eventType: "lesson_draft"`, `eventId: ld:<sessionId>:<requestId>`,
payload `{ quickAssessmentId, assignmentId, questionIds, model, inputTokens, outputTokens, costUsd }`.
A second tap looks up the latest such event whose quick check and homework are both still DRAFT and
returns `{ existing: true, ... }` without calling the model; `replace: true` deletes them and their
hidden questions in the same transaction that writes the new ones.

## Route contract

`POST /api/live/lesson-draft` — body `{ sessionId?, lessonId?, topic?, assignmentId?, replace?, homeworkOnly? }`
(strict). Identity from the session only. Before the stream: 401 `NOT_AUTHENTICATED`, 400
`MISSING_SCHOOL` / `VALIDATION_ERROR`, 403 `UNAUTHORIZED`, 404 `LESSON_DRAFT_DISABLED`.
Stream: `: open`, `event: stage {stage}` (`reading` | `writing` | `saving`), `: ping` every 10 s,
`event: done {quickAssessmentId, assignmentId, existing?}` or `event: error {code}`.

Error codes: `LESSON_DRAFT_DISABLED`, `_CAP`, `_TEACHER_LIMIT`, `_NO_LESSON`, `_NO_TEXT`,
`_INCOMPLETE`, `_TIMEOUT`, plus `NOT_AUTHENTICATED`, `MISSING_SCHOOL`, `UNAUTHORIZED`, `NOT_FOUND`,
`VALIDATION_ERROR`, `UNKNOWN`. Messages live in `liveClasses.lessonDraft.errors` (ar + en).

## Env

`LESSON_DRAFT_ENABLED` (`1`), `LESSON_DRAFT_CAP_USD` (10), `LESSON_DRAFT_DAILY_USD` (1),
`LESSON_DRAFT_TEACHER_DAILY` (10). See `DEPLOYMENT.md`.

## Eval

`scripts/lesson-draft/eval.ts` (not run in CI; costs a few cents):

```bash
npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs scripts/lesson-draft/eval.ts [--limit N]
```

Eight invented Arabic excerpts (grammar, reading, maths, science, Islamic studies, history,
geography, ICT). Target: 100 % structural, >= 90 % grounded.
