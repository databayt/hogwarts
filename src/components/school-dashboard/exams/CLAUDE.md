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

- **Exam creation = 2-mode chooser; template-BUILD wizard removed (2026-07-18)** —
  `/exams/new` (`create/content.tsx`) is a one-screen chooser with **Adopt a template**
  (catalog browse/adopt + `AdoptExamDialog`) and **Generate with AI**
  (→ `/exams/qbank/ai-generate`). The old **Build from scratch** card and the entire
  5-step `wizard/template-wizard/` + its `/exams/template/add/**` routes were **deleted** —
  we no longer build exam-paper templates from primitives in-app. A paper's **layout** is
  now an uploaded `.docx` (category `EXAM_PAPER`) filled via the
  `GenerateWithTemplateButton` on `/exams/paper/[id]` (see the `documents` block +
  `src/lib/docx-fill/`). A paper's **question distribution** still lives on
  `SchoolExamTemplate`, now populated by adopting a catalog blueprint (`adoptExamTemplate`)
  or the qbank/generate `createTemplate` actions — NOT a wizard. `generate/content.tsx`
  template CTAs repoint to `/exams/generate/catalog`; `exam-wizard-v2` (template→exam
  selection) and the `generate/templates` list are unchanged. `examType` still persists in
  `blockConfig.examType` (no own column).
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
- **Take route uses the proctored engine (2026-07-18)** — `/exams/[id]/take`
  renders `ExamPlayer` (take/exam-player.tsx) fed by the new `getExamForPlayer`
  loader (take/actions.ts); submit goes through `submitExamSession` (instant
  objective grade). The old bare `ExamTakingContent` + `submitExamAnswers`/
  `getExamForTaking` (manage/actions/status.ts) are **DEAD/@deprecated** — they
  wrote `session.user.id` as `StudentAnswer.studentId`, but that FK is
  `Student.id` (resolve via `db.student.findFirst({ userId })`). `getExamForPlayer`
  strips `isCorrect` from options and passes a derived `isMultiSelect` flag so
  correct answers never reach the browser. **Note:** `PRODUCTION-AUDIT.md`'s claim
  that this bug was "Fixed 2026-05-08" was stale — the code still had it.
- **Exam-lifecycle cron auto-opens/closes (2026-07-18)** — `/api/cron/exam-lifecycle`
  (\*/15) flips PLANNED→IN_PROGRESS at the scheduled start and IN_PROGRESS→COMPLETED
  after the end (examDate + endTime + lateSubmitMinutes, via `setHours` like
  `lib/security.ts`). It does NOT mark/finalize (marking is auth/tenant-scoped and
  has no session in a cron). The "Auto-mark & publish" button now finalizes with
  `aiGradeSubjective: true` — one click objective-marks + AI-grades subjective +
  publishes. A fully session-less AI-finalize-at-close is a deferred follow-up
  (needs cron-callable cores extracted from the auth-bound marking stack).

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
