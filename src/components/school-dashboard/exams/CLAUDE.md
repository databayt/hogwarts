---
epic: 03
sprint: Q3-2026
title: Exams
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 78
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-06-14
---

# Exams Block

## Context

Exams — Q3 2026 sprint epic 03, maturity `Built+Polish`, ~78% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [321](https://github.com/databayt/hogwarts/issues/321).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/321) for cross-feature dependencies

## Key Decisions

- **Exam creation = 3-mode chooser, not a long wizard (2026-06-23)** — `/exams/new`
  is a one-screen chooser (`create/content.tsx`): **Adopt a template** (catalog
  browse/adopt + `AdoptExamDialog`), **Generate with AI** (→ `/exams/qbank/ai-generate`),
  **Build from scratch** (the 5-step template wizard). The template wizard
  (`wizard/template-wizard/`) is exactly 5 one-screen steps —
  `gallery → basics → questions → difficulty → review` — and is the _fallback_, not
  the front door. **Appearance is region-preset-only**: the `gallery` step's preset
  writes the full `blockConfig` (slots + decorations); there are no per-slot layout
  steps and no print step (defaults come from `parseTemplateToWizardData`). Step order
  lives in `config.ts` (`getNextStep()`); don't hardcode `nextStep` URLs. Removed/legacy
  step slugs are remapped by `normalizeTemplateWizardStep()` so old drafts resume on a
  valid step. `examType` persists in `blockConfig.examType` (no own column) — read it
  back there, don't hardcode `"MIDTERM"`.
- **Gradebook spine is NOT "use server"** — `grades/lib/gradebook.ts` is a plain
  helper module imported by server actions. Marking it `"use server"` would expose
  each export as an HTTP endpoint. Import it; do not add the directive.
- **Two result stores, no double-count** — `ExamResult` is the exam-module store
  (used by certificates, analytics, the mark/results screens). `Result` is the
  unified gradebook table (used by the grades UI and report cards). Both are
  written by `finalizeExamResults`; `generateReportCards` deduplicates by `examId`.
- **Answer-key read fix (2026-06-14)** — `getOrCreateAnswerKey` previously read a
  non-existent `questionIds` field and produced empty keys. It now reads the
  `GeneratedExamQuestion` relation. If you touch the answer-key path, verify that
  questions are returned before auto-marking proceeds.
- **Auto-generate drops stale answer key** — after re-generating questions via
  `autoGenerateExamQuestions`, the existing `ExamAnswerKey` rows are deleted so
  the marking step rebuilds from the new question set. Do not skip this delete.
- **Instant-grade on submit** — `submitExamSession` auto-marks fully-objective
  exams immediately. Exams with subjective questions (Essay, Short Answer) still
  require the manual/AI marking step before `finalizeExamResults` is called.

## Danger Zones

- **Missing `schoolId` in any query** — cross-tenant data leak (CRITICAL). All
  exam, question-bank, and result queries must include `schoolId`.
- **Re-generating questions on a live exam** — `autoGenerateExamQuestions`
  deletes existing `GeneratedExamQuestion` rows inside a `$transaction`. Never
  call it after an exam session has started; check `Exam.status` first.
- **`$transaction` closure variable collapse** — Prisma `$transaction` callbacks
  can resolve return types to `never` if outer-scope variables are reassigned
  inside. Return rows directly from the transaction array; do not rely on
  outer-scope reassignment.
- **Exam-reminders cron** — runs on a fixed schedule; if the cron fires after an
  exam's `startTime`, reminders must be skipped (check `examDate >= now`).

## Related Blocks

- **grades** (`src/components/school-dashboard/grades/`) — owns `grades/lib/gradebook.ts` (shared write path). Every scoring surface imports from there.
- **stream** (`src/components/stream/`) — lesson quizzes write to the same `Result` table via the gradebook spine.
- **notifications** (`src/components/school-dashboard/notifications/`) — `dispatchNotification` / `dispatchNotificationsToAudience` used for results-published and exam-reminders.
- **timetable** (`src/components/school-dashboard/timetable/`) — conflict detection reads timetable slots for the same class/time window.

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
