---
epic: 03
sprint: Q3-2026
title: Grades
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 94
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-06-14
---

# Grades Block

## Context

Grades — Q3 2026 sprint epic 03, maturity `Built+Polish`, ~94% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [321](https://github.com/databayt/hogwarts/issues/321).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/321) for cross-feature dependencies

## Key Decisions

- **Gradebook spine is the single write path** — `grades/lib/gradebook.ts`
  exports `toPercentage`, `letterGradeFor`, `upsertExamResult`,
  `upsertGradebookResult`, and `resolveStudentClassForSubject`. Every automated
  scoring surface (exams, quick assessments, stream quizzes) MUST route through
  these helpers. Do not write directly to `ExamResult` or `Result` from outside
  this module.
- **NOT "use server"** — `grades/lib/gradebook.ts` is a plain helper file.
  Adding `"use server"` would expose each export as a POST HTTP endpoint. Import
  it from server actions; do not add the directive.
- **Two result stores, no double-count** — `ExamResult` (exam-module store,
  used by certificates + exam analytics) and `Result` (unified gradebook, used
  by the grades UI and report cards). `finalizeExamResults` writes both.
  `generateReportCards` deduplicates by `examId` to prevent duplicate rows on
  re-runs.
- **Report card publish triggers a notification** — `publishReportCards`
  dispatches `report_card_ready` to the class audience via
  `dispatchNotificationsToAudience`. Do not remove this call when refactoring.
- **`resolveStudentClassForSubject` is best-effort** — it returns `null` when
  the student can't be tied to a class. Callers (stream quiz, quick assessment)
  must skip the gradebook write rather than error when null is returned.

## Danger Zones

- **Missing `schoolId` in any query** — cross-tenant data leak. All queries in
  `gradebook.ts` and the actions files include `schoolId`; do not remove it.
- **`upsertGradebookResult` match logic** — the idempotent match uses the most
  specific FK available: `examId` → `assignmentId` → `(subject+title)`. If you
  add a new source type, define its match key or you will get duplicate rows.
- **Grade boundaries** — `letterGradeFor` passes boundaries to `calculateGrade`.
  When no boundary covers a percentage, `calculateGrade` returns `"F"`.
  Custom per-school boundaries are stored in `GradeBoundary`; the default
  fallback scale is A+/A/B+/B/C+/C/D+/D/F.

## Related Blocks

- **exams** (`src/components/school-dashboard/exams/`) — primary consumer of `gradebook.ts`; `finalizeExamResults` writes both `ExamResult` and `Result`.
- **stream** (`src/components/stream/`) — lesson quizzes use `upsertGradebookResult` via `resolveStudentClassForSubject`.
- **notifications** (`src/components/school-dashboard/notifications/`) — `publishReportCards` dispatches via `dispatchNotificationsToAudience`; exam results-published dispatches via `dispatchNotification`.
- **quick assessments** — write to `Result` via the gradebook spine.

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
