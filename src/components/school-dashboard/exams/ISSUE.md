---
epic: 03
sprint: Q3-2026
title: Exams
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 78
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-06-14
---

# Exams -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 78%
**Last Updated:** 2026-06-23

---

## Recently Added

- **Automatic exam→grade pipeline + take-engine fix (2026-07-19)** — `/exams/[id]/take` now renders the proctored `ExamPlayer` via a new `getExamForPlayer` loader that resolves the REAL `Student.id`. The old bare path (`submitExamAnswers`/`getExamForTaking` in `manage/actions/status.ts`, and `take/content.tsx`) wrote `session.user.id` as `StudentAnswer.studentId` — but that FK is `Student.id`, so answers never matched downstream (`PRODUCTION-AUDIT.md` falsely claimed this "Fixed 2026-05-08"). Those are deleted/`@deprecated`. `getExamForPlayer` strips `isCorrect` and passes a derived `isMultiSelect` so correct answers never reach the browser. Objective exams instant-grade per student on submit (`submitExamSession → finalizeStudentExam`) → `ExamResult` + gradebook `Result`. New `/api/cron/exam-lifecycle` (\*/15) auto-opens PLANNED→IN_PROGRESS at scheduled start and closes IN_PROGRESS→COMPLETED after end (examDate+endTime+lateSubmitMinutes, `setHours` like `lib/security.ts`); the "Auto-mark & publish" button (`mark/finalize-button.tsx`) now finalizes with `aiGradeSubjective: true` (one-click objective-mark + AI-grade subjective + publish). **Paper-config race fixed:** `ExamPaperConfig.generatedExamId` is `@unique`, so concurrent `getOrCreatePaperConfig` calls on first load raced → the loser's `createPaperConfig` P2002'd → swallowed "Failed to create paper configuration" blanked the whole paper page. Now `createPaperConfig` returns the winning row on P2002, `getOrCreatePaperConfig` re-fetches on any create failure, and `paper/content.tsx` renders the header + "Generate (my template)" button even if config can't load. Browser+DB verified end-to-end (student took an 8-Q exam → 15/15 A+ instant-grade under the correct `Student.id`). **Deferred:** fully session-less AI-finalize-at-close cron — the marking stack (`getOrCreateAnswerKey`/`batchAutoGradeWithKey`/`batchAIGrade`) derives `schoolId` from `auth()`, so it needs cron-callable cores extracted first. tsc 0.
- **Exam-creation reframe — 3-mode chooser + 5-step template wizard (2026-06-23)** — Reframed exam creation around a one-screen **3-mode chooser** at `/exams/new` (Adopt a template · Generate with AI · Build from scratch), surfacing the fast paths (catalog adopt, AI) that were previously buried behind a long wizard. **Collapsed the template wizard from 15–22 steps to 5 one-screen steps**: `gallery → basics → questions → difficulty → review`. The 6 per-slot paper-layout steps (header/student-info/instructions/footer/answer-sheet/cover) + the print step were **deleted** — appearance is chosen once via the gallery **region preset** (sd/sa/us/mena), which already writes the full `blockConfig` (slots+decorations); `printConfig` defaults via `parseTemplateToWizardData`. The up-to-7 per-question-type **difficulty** slider steps collapsed into **one pre-filled table** (`updateTemplateAllDifficulties`, valid on load via `balancedDifficulty`). **Scoring** folded into `review` (single passing-score field; A–F bands default). New `basics` step merges name + subject + exam-type + duration + marks (subsumes the 2026-06-22 subject-step grade-filter WIP, folded in). Centralized step routing via `getNextStep()` in `config.ts`; deleted `buildDynamicConfig`; added `normalizeTemplateWizardStep()` + `TEMPLATE_STEP_REDIRECTS` so in-flight drafts pointing at removed steps resume on a valid screen (applied inside `parseTemplateToWizardData`); fixed the `examType` round-trip (now read from `blockConfig.examType` instead of hardcoded `"MIDTERM"`). **Adopt** mode wired: `catalog-tab.tsx` Adopt buttons now open `AdoptExamDialog` (class + date + start/end time → `adoptExam` → routes to `/exams/paper/[id]/preview`). **AI** mode routes to the existing working `/exams/qbank/ai-generate`; the exam-level "one-prompt → fully-assembled paper" wrapper (on Claude) is a documented fast-follow. Deleted 14 component step dirs + 15 route dirs (incl. the dynamic `difficulty/[questionType]`). **tsc 0.** New/changed: `wizard/template-wizard/{config,labels,wizard-actions}.ts`, `wizard/types.ts`, new `basics/`+`questions/`+`review/`, rewritten `difficulty/`, `create/content.tsx`, `generate/adopt-exam-dialog.tsx`; docs `docs-en/{exams,competitors}.mdx` (25-tool assessment landscape). Deferred: `docs-ar/exams.mdx` mirror; exam-level AI wrapper; per-preset `printConfig`.
- **Manage table cleanup — leaner columns + honest vocabulary (2026-06-22)** — reduced the `/exams/manage` list from 9 data columns to 7: merged Date + Start Time + Duration into one compact **"When"** column (`Jun 22 · 09:00 · 90 min`), shortened header "Total Marks" → "Marks", and made the Title cell medium-weight as the row anchor. Replaced the misleading **"Class"** column (which showed the `Class` _course-offering_ name) with **"Grade"** (`class.grade.name` → AcademicGrade, localized for AR, `—` fallback). Renamed the internal subject accessor `name` → `subjectName`. Fixed inverted status badge emphasis (IN_PROGRESS now `default`/loud, PLANNED `outline`, COMPLETED `secondary`), made exam-type badge labels readable and consistent with their filter options (was `HW`/`Proj`/`Prac`), removed the dead `examTypeLabels` map, and replaced hardcoded `"Unknown"` fallbacks with `—`. Files: `manage/{columns,content,types}.tsx`, `manage/actions/{types,read}.ts` (both query includes + both row mappings, so initial render and load-more stay in sync). NOTE: **Section is not a selectable exam dimension** — exams FK to `Class` (which has no `sectionId`); a real Section column would need a schema change. tsc clean.
- **Template wizard subject step — grade filter + Select (2026-06-22)** — replaced the clickable-Badge subject picker with a shadcn `Select`, and added a grade-filter `Select` above it that narrows the subject list client-side (`useMemo`). `getSubjectOptions` now returns each subject's `grades: number[]` (queried via `subjectSelection` with `schoolId` scope + `distinct`); the filter only renders when subjects carry grade data. Selection still persists only `subjectId` — filtering is UI-only and does not clear a chosen subject. Files: `wizard/template-wizard/subject/{actions,content,form}.tsx` + `wizard/template-wizard/labels.ts` (new `subjectLabels`, en/ar).
- **AI cost cap wired (2026-06-21)** — added `checkAIGenerationRateLimit` (20/min burst + 300/day per-school ceiling) and wired it into `generateQuestionsAI`; wired the previously-orphaned `checkAIGradingRateLimit` (100/min/school) into `aiGradeAnswer` (`batchAIGrade` inherits it per-answer). Both rate-limit helpers were defined-but-unused before this date despite `PRODUCTION-AUDIT.md` claiming they were wired — corrected that doc. Covered by `src/tests/school-dashboard/exams/lib/security.test.ts` (5 tests). NOTE: the limiter is still in-memory/per-replica (resets on cold start); a hard cross-instance cap needs Upstash Redis (bucket ③, env-gated). Follow-up (adversarial review 2026-06-21): the day-cap check now runs BEFORE the minute burst guard so a request blocked by the daily ceiling no longer consumes a minute slot or mis-reports `scope: "minute"` with a ~60s wait.
- **RBAC test coverage (2026-06-21)** — added `src/tests/school-dashboard/exams/lib/permissions.test.ts` (10 tests): the full `hasPermission` role matrix (DEVELOPER/ADMIN full, TEACHER author-but-not-publish/override, ACCOUNTANT read-only, STUDENT/GUARDIAN/STAFF read-scoped, unknown role deny-by-default) + `getExamTabsForRole` (management tabs gated to DEVELOPER/ADMIN/TEACHER; STUDENT/GUARDIAN/ACCOUNTANT read-only tabs; unknown role → overview only). The score calculator was already covered (`results/lib/calculator.test.ts`, 61 tests) — the audit's "calculator untested" claim was stale.

---

## MVP Checklist

### Manage Sub-Block

- [x] Multi-step exam creation form (basic info, schedule/marks, instructions)
- [x] Exam status workflow (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
- [x] Calendar view for scheduling
- [x] Marks entry interface with validation
- [x] Analytics dashboard (averages, distribution, rankings)
- [x] Search, filter, and sort
- [x] Conflict detection (same class, overlapping time)
- [x] Export capabilities (CSV, PDF schedule)
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (verified 2026-06-21 — full route tree present and wired to content components with auth + RBAC; the earlier "BLOCKER: routes missing" claim was stale)

### Question Bank Sub-Block

- [x] 5 question types (MCQ, True/False, Fill-in-Blank, Short Answer, Essay)
- [x] Difficulty levels (Easy, Medium, Hard)
- [x] Bloom's taxonomy classification (6 levels)
- [x] AI-powered question generation
- [x] Tagging and categorization
- [x] Practice mode and sessions
- [x] Catalog tab view
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (verified 2026-06-21 — full route tree present and wired to content components with auth + RBAC; the earlier "BLOCKER: routes missing" claim was stale)

### Generate Sub-Block

- [x] Exam template management
- [x] Question distribution configuration
- [x] Distribution editor UI
- [x] Question selection algorithms
- [x] Bloom's taxonomy balancing
- [x] Difficulty distribution
- [x] Template reuse across classes
- [x] Version library
- [x] Route pages created in app directory (verified 2026-06-21 — full route tree present and wired to content components with auth + RBAC; the earlier "BLOCKER: routes missing" claim was stale)

### Mark Sub-Block

- [x] Auto-grading for MCQ/True-False/Fill-in-Blank
- [x] AI-assisted essay and short answer grading
- [x] Rubric-based grading system
- [x] Manual grading interface with override support
- [x] Bulk grading capabilities
- [x] CSV import for marks
- [x] Mobile grading view
- [x] Answer key management
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (verified 2026-06-21 — full route tree present and wired to content components with auth + RBAC; the earlier "BLOCKER: routes missing" claim was stale)

### Results Sub-Block

- [x] Grade calculation with configurable boundaries
- [x] Class rank computation with tie handling
- [x] Performance analytics (average, median, distribution)
- [x] PDF report generation (3 templates: classic, modern, minimal)
- [x] Batch PDF generation
- [x] CSV import/export for results
- [x] Question-wise breakdown
- [x] Analytics charts
- [x] Cache manager for performance
- [x] Route pages created in app directory (verified 2026-06-21 — full route tree present and wired to content components with auth + RBAC; the earlier "BLOCKER: routes missing" claim was stale)

### Additional Modules

- [x] Paper composition system with multiple templates (classic, modern, formal, custom)
- [x] Template wizard with 14 configuration steps
- [x] Grading module (grade converter, CGPA calculator, retake manager)
- [x] Progress/schedule tracking
- [x] Mock exam content

### Cross-Cutting

- [x] Multi-tenant isolation (schoolId on all queries)
- [x] Zod validation on all server actions
- [x] TypeScript types for all data models
- [x] i18n dictionary keys (150+ keys, EN/AR)
- [x] RTL support for Arabic
- [x] **Gradebook spine** — all scoring surfaces write to the unified `Result` table via `grades/lib/gradebook.ts`
- [x] **Auto-generate from template** — one-click question selection wired into the exam-generate wizard (`wizard/exam-wizard-v2/questions/auto-generate.ts`)
- [x] **Answer-key bug fixed** — `getOrCreateAnswerKey` now reads `GeneratedExamQuestion` relation instead of a non-existent `questionIds` field; empty answer keys no longer produced
- [x] **Finalize loop** — `exams/mark/actions/finalize.ts`: `finalizeExamResults` aggregates `MarkingResult` → `ExamResult` + unified `Result`, dispatches publish notifications
- [x] **Instant-grade on submit** — `submitExamSession` auto-marks fully-objective exams and writes the result immediately
- [x] **Exam reminders cron** — `/api/cron/exam-reminders` notifies students/teachers ahead of scheduled exams
- [x] **Unit tests** — `src/tests/school-dashboard/exams/gradebook.test.ts` (pure helpers) + `auto-generate-coverage.test.ts` (type shapes + coverage logic)
- [ ] Route pages wired for all sub-blocks (BLOCKER)
- [ ] Sidebar navigation entries added

---

## Known Issues

### P0 -- Critical

_None open._ (Historical: this said "no route pages exist." That was stale — the
route tree is present and reachable: top-level `page.tsx` plus `qbank`, `generate`,
`mark`, `result`, `quiz`, `mock`, `upcoming`, `new`, `[id]`, `certificates`,
`report-cards`, `paper/[generatedExamId]`. The one real gap — `manage/content.tsx`
(the schoolId-scoped exam-list table) had no route or nav tab — was fixed
2026-06-20: added `exams/manage/page.tsx` + a `manage` tab in `getExamTabsForRole`
for DEVELOPER/ADMIN/TEACHER + the `nav.manage` dictionary key (en/ar).)

### P1 -- High

1. **OCR dependency** -- AI-assisted marking requires OpenAI API key configuration
2. **AI generation costs** -- No budget controls or cost tracking in production

### P2 -- Medium

1. **Recurring exams** -- Cannot schedule weekly quizzes automatically
2. **Partial marks** -- Marks are integer-only, no half marks support
3. **Offline mode** -- No offline support for marks entry
4. **Drag-and-drop** -- Calendar rescheduling via drag-and-drop not implemented
5. **Question versioning** -- Editing overwrites original, no history
6. **Real-time collaboration** -- No live updates when multiple teachers grade

---

## Enhancements (Post-MVP)

- Automatic status transitions based on exam date/time
- Plagiarism detection for essay answers
- Video/audio answer support
- Peer grading workflows
- Question import from external formats (QTI)
- Custom PDF template builder
- Performance trend analysis across terms
- Student self-assessment and practice exams

---

---

## Resolved Issues

- **2026-06-22 — Dashboard UI polish (cosmetic only).** Admin exams dashboard
  (`content.tsx`, `exam-card-flip.tsx`): removed the flip card's `max-w-[280px]`
  cap so it fills its `320px` hero column, making the gap to the "Total Exams"
  stat consistent (was ~64px of dead space, now the `gap-6` gutter). Applied an
  Apple-style pass to the sections below the hero — `rounded-3xl` cards, subtle
  hover lift (`-translate-y-0.5` + shadow), larger `tracking-tight` stat numerals,
  `rounded-2xl` inner boxes. className-only; no logic/data/i18n changes. Buttons
  deliberately left at the global shadcn radius (no pill conversion) to stay
  consistent with the rest of the dashboard.

- **2026-06-14 — Automation pass.** Auto-generate wired into wizard (one-click
  template → question selection); answer-key empty-key bug fixed (was reading
  non-existent `questionIds` field, now reads `GeneratedExamQuestion` relation);
  finalize loop (`finalizeExamResults` / `finalizeStudentExam`) writes both
  `ExamResult` and unified `Result`, dispatches results-published notification;
  instant-grade on submit for objective-only exams; exam-reminders cron added.
  Gradebook integration P1 resolved via `grades/lib/gradebook.ts` spine.

**Last Review:** 2026-06-14
