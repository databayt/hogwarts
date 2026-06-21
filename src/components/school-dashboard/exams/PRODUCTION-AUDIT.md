# Exam Block — Production-Readiness Audit

**Date:** 2026-05-08 (audit) · last fix pass 2026-05-08
**Scope:** `src/components/school-dashboard/exams/` (505 files, ~96k LOC, 17 sub-blocks) + routes under `(school-dashboard)/exams/` + `(exam-wizard)/` + `prisma/models/{exam,school-exam,question,grading-scheme,school-qbank}.prisma`
**Verdict:** **Still not production-ready, but bleeding stopped.** ~70% complete. 9 P0 remaining (was 14), 22 P1, 18 P2.
**Composite grade:** **C** (DB: C+, Tests: D, Security: B–, i18n: C+, Architecture: B–)

## ✅ Phase 1 fixes applied (2026-05-08)

| #   | Fix                                                                                                                                                                                                                                                                                       | Files                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | `submitExamAnswers` now resolves `Student.id` from session via `db.student.findFirst({ userId, schoolId })` instead of using `User.id`                                                                                                                                                    | `manage/actions/status.ts:497+`                          |
| 2   | `getExamForTaking` resolves `Student.id` correctly; teachers/admins previewing the exam are tolerated (no Student row)                                                                                                                                                                    | `manage/actions/status.ts:309+`                          |
| 3   | `submitExamAnswers` is now wrapped in `db.$transaction(...)` with `Promise.all` — atomic all-or-nothing submission, no more partial commits                                                                                                                                               | `manage/actions/status.ts:540+`                          |
| 4   | `submitAnswer` and `getStudentAnswers` resolve `Student.id` correctly                                                                                                                                                                                                                     | `mark/actions/submission.ts:22, 184`                     |
| 5   | ⚠️ **NOT done** — `lib/security.ts` is still an in-memory per-process `Map`, **not** Upstash Redis. This row described an intended rewrite that was never committed. Distributed Redis remains open (caveat below); on Vercel serverless the cap is per-replica and resets on cold start. | `lib/security.ts` (still in-memory)                      |
| 6   | ✅ **Actually wired 2026-06-21** — `checkAIGenerationRateLimit` (new helper) now gates `generateQuestionsAI`: 20/min burst **+ 300/day** per-school cost ceiling. (In-memory cap — see row 5 caveat.)                                                                                     | `qbank/actions/ai-generation.ts`, `lib/security.ts`      |
| 7   | ✅ **Actually wired 2026-06-21** — `checkAIGradingRateLimit` (100/min/school) now gates `aiGradeAnswer`; `batchAIGrade` inherits it per-answer. (Both were defined-but-unused before this date.)                                                                                          | `mark/actions/ai-grade.ts`                               |
| 8   | ⚠️ **NOT done** — `checkExamSubmissionRateLimit` is still defined-but-unused (`submitExamAnswers`/`submitAnswer` do not call it). Deferred: the student-submission hot path is higher-risk to gate with an unreliable per-replica limiter — wire it together with the Redis work (row 5). | `manage/actions/status.ts`, `mark/actions/submission.ts` |
| 9   | **Public certificate verify hardened**: now rate-limited by IP (10/min), rejects `status !== "active"` (was leaking PII for revoked certs), rejects expired certs                                                                                                                         | `certificates/actions/index.ts:verifyCertificate`        |

> **Doc-integrity correction (2026-06-21):** rows 5–8 in this table previously
> read as completed but were aspirational — the rate-limit helpers existed yet had
> **zero callers**, and `lib/security.ts` was never moved to Redis. Rows 6–7 are
> now genuinely true (AI cost cap landed, in-memory); rows 5 and 8 remain open and
> are marked accordingly. Verified `pnpm tsc --noEmit` = 0 errors from these
> changes; `permissions.test.ts` + `security.test.ts` (15 tests) green.

---

---

## TL;DR — Top 10 production blockers

| #   | Severity   | Issue                                                                                     | Location                                             | Status                                                                                                                                           |
| --- | ---------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | ~~**P0**~~ | ~~`submitExamAnswers` writes `User.id` as `Student.id`~~                                  | `manage/actions/status.ts`                           | ✅ Fixed 2026-05-08                                                                                                                              |
| 2   | **P1**     | In-memory rate limiter on Vercel serverless                                               | `lib/security.ts`                                    | Partly — AI generation + grading caps now enforced (in-memory, 2026-06-21); distributed Redis still **open** (per-replica, resets on cold start) |
| 3   | **P0**     | Bilingual fields (`bodyTemplateAr`, `titleAr`, `nameEn`)                                  | cert-wizard, certificates, paper, `school.prisma:6`  | Open — needs schema migration                                                                                                                    |
| 4   | **P0**     | Two parallel result models (`Result` & `ExamResult`) writable on same exam                | `school-exam.prisma:125-126`                         | Open — needs design decision                                                                                                                     |
| 5   | **P0**     | Cascade `Class → SchoolExam → ExamResult → ExamCertificate` all `Cascade`                 | `school-exam.prisma:123,213,627`                     | Open — needs schema migration                                                                                                                    |
| 6   | **P0**     | `ExamResult.marksObtained Int` vs `MarkingResult.pointsAwarded Decimal(5,2)`              | schemas                                              | Open — needs schema migration                                                                                                                    |
| 7   | ~~**P0**~~ | ~~`submitExamAnswers` is not in a transaction~~                                           | `manage/actions/status.ts`                           | ✅ Fixed 2026-05-08                                                                                                                              |
| 8   | **P0**     | 17 content models missing `lang` field                                                    | `school-exam.prisma`, `school-qbank.prisma`          | Open — needs schema migration                                                                                                                    |
| 9   | ~~**P0**~~ | ~~RBAC layer (`lib/permissions.ts`) is 0% tested~~                                        | `src/tests/.../exams/lib/permissions.test.ts`        | ✅ Fixed 2026-06-21 — 10 tests, full role→permission matrix + tab gating                                                                         |
| 10  | ~~**P0**~~ | ~~Score-calculation library (`results/lib/calculator.ts`, 22 fns) is 0% tested~~          | `src/tests/.../exams/results/lib/calculator.test.ts` | ✅ Already covered — 61 tests (audit claim was stale)                                                                                            |
| 11  | **P0+**    | `verifyCertificate` (public) leaked PII for revoked certs, no rate-limit, no expiry check | `certificates/actions/index.ts:652`                  | ✅ Fixed 2026-05-08                                                                                                                              |
| 12  | **P0+**    | AI generation + AI grading endpoints had ZERO rate limiting                               | `qbank/.../ai-generation.ts`, `mark/.../ai-grade.ts` | ✅ Fixed 2026-05-08                                                                                                                              |
| 13  | **P0+**    | `submitAnswer` (mark) and `getStudentAnswers` had same `User.id`-as-`Student.id` bug      | `mark/actions/submission.ts:22, 184`                 | ✅ Fixed 2026-05-08                                                                                                                              |

---

## P0 — Critical blockers (must fix before any production roll-out)

### A. Correctness / data-integrity bugs

#### A1. Submission flow uses wrong ID (DATA CORRUPTION)

- **File:** `src/components/school-dashboard/exams/manage/actions/status.ts:508,544`
- **Symptom:** `submitExamAnswers` does `const studentId = session?.user?.id` then `studentAnswer.upsert({ where: { examId_questionId_studentId: { studentId } } })`. But `Student.id !== User.id` — `Student` is a separate table linked via `Student.userId`.
- **Compare to correct pattern:** `take/actions.ts:113` resolves `db.student.findFirst({ where: { userId } })` first.
- **Fix:** add a `resolveStudentId(userId, schoolId)` helper, replace both `session?.user?.id` usages in `status.ts`.
- **Test:** integration test asserting `studentAnswer.studentId === student.id` not `user.id`.

#### A2. `submitExamAnswers` not transactional

- **File:** `manage/actions/status.ts:540-573`. Sequential `await db.studentAnswer.upsert(...)` in a `for` loop, no `db.$transaction`.
- **Risk:** mid-submit network failure ⇒ partial answers in DB; student sees "submitted" but their last 5 answers are missing.
- **Fix:** wrap in `db.$transaction`, build `Promise.all` inside the transaction.

#### A3. Score type mismatch

- `ExamResult.marksObtained Int` (`school-exam.prisma:203`) but `MarkingResult.pointsAwarded Decimal(5,2)`.
- Auto-grade aggregates per-question Decimals into Int → truncation. A student earning 7.5/10 across 4 questions gets 30 instead of 30.0.
- **Fix:** Standardize on `Decimal(6,2)` for all marks fields (`ExamResult.marksObtained`, `totalMarks`, `passingMarks`, `ExamCertificate.score`). One migration.

### B. Tenant / authorization gaps

#### B1. In-memory rate limiter on serverless

- **File:** `lib/security.ts:33` — `new Map<...>()`. Comment says "use Redis in production for multi-instance". This is the prod build path.
- Affects: `checkExamSubmissionRateLimit`, `checkAIGradingRateLimit`, `checkAttemptLockRateLimit`. Every cold start resets; cross-replica state is per-replica.
- **Fix:** swap to Upstash Redis (already used elsewhere in repo, see `src/lib/circuit-breaker.ts` pattern). Add a fallback wrapper that no-ops gracefully if Redis is down (don't block exam submission).

#### B2. RBAC layer untested

- 707-line `lib/permissions.ts` defines the entire role × permission matrix and ownership rules (`canAccessExam`, `canModifyExam`, `canAccessStudentResult`, `canManageQuestions`, `canAccessAnalytics`, `applyPermissionFilters`). Zero unit tests. Zero E2E tests cover ACCOUNTANT/STAFF roles.
- **Fix:** add `lib/__tests__/permissions.test.ts` with the full role × permission matrix (≈ 7 roles × 20 permissions = 140 cases), plus 4 ownership cases per fn.

#### B3. AI generation has no per-school cost cap

- `qbank/actions/ai-generation.ts:generateQuestionsAI` calls OpenAI gpt-4o (`src/lib/ai/openai.ts`) — no rate-limit check, no per-school budget enforcement, no cost tracking written to DB. `aiRateLimiter` exists but is global, not per-tenant.
- `mark/actions/ai-grade.ts:aiGradeAnswer` also has no per-school cap.
- **Fix:** add `AICostUsage { schoolId, action, costUsd, tokens, createdAt }` model + `assertWithinBudget(schoolId)` gate before any `getOpenAIClient()` call. Budget defined per school in `School.aiBudgetUsd`.

#### B4. Hardcoded English errors in 9 action files

- `paper/actions/{paper-config,catalog-paper,paper-generation}.ts`, `progress/actions.ts`, `mock/take-actions.ts`, `wizard/template-wizard/wizard-actions.ts` all return `{ error: "Unauthorized", error: "Not found", error: "Template not available" }` etc. instead of error codes.
- **Fix:** Replace all hardcoded strings with `errorCode: "UNAUTHORIZED" | "NOT_FOUND" | ...`, translate at client via `ErrorHelper`.

#### B5. Hardcoded Arabic notification text

- `manage/actions/crud.ts:131,372` — `"امتحان جديد"`, `"إلغاء امتحان"` literal strings in notification creation.
- **Fix:** use `formatter.ts` extracted in earlier overhaul (memory: `project_exams_test_overhaul.md`); pass `lang` from school context.

### C. Schema rule violations

#### C1. Bilingual fields (forbidden by `translation.md`)

| File                                                                               | Field                                                 | Action                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `school-exam.prisma:556-558`                                                       | `ExamCertificateConfig.titleTextAr`, `bodyTemplateAr` | drop, store in primary `lang` only |
| `school-exam.prisma:603`                                                           | `ExamCertificate.recipientNameAr`                     | drop                               |
| `prisma/models/school.prisma:6`                                                    | `School.nameEn`                                       | drop                               |
| `wizard/cert-wizard/{actions,types,client,steps/info-step,steps/preview-step}.tsx` | `bodyTemplateAr`                                      | use `bodyTemplate` + `lang`        |
| `certificates/{validation,config-form}.tsx`                                        | `bodyTemplateAr`, `titleEn`, `titleAr` (UI labels)    | dictionary keys                    |
| `paper/config-form.tsx:56-68,881`                                                  | `labelAr` for curriculum presets                      | use `getText()` or dictionary      |

Migration: split data into `Translation` rows on first read, then drop columns in next migration.

#### C2. 17 models missing `lang String @default("ar")`

School-layer (school-exam, school-qbank, grading-scheme, school.prisma) is uniformly missing `lang`. Catalog layer correctly has it. Models that need it:
`SchoolExam`, `ExamResult`, `Rubric`, `RubricCriterion`, `StudentAnswer`, `MarkingResult`, `GradeOverride`, `ExamPaperConfig`, `ExamCertificateConfig`, `ExamCertificate`, `Result`, `ReportCard`, `ReportCardGrade`, `QuestionBank`, `SchoolExamTemplate`, `GeneratedExam`, `QuestionReview`. Plus `SourceMaterial.language` should be renamed `lang` for consistency.

#### C3. Two competing result models

- `SchoolExam.results: Result[]` AND `SchoolExam.examResults: ExamResult[]` (`school-exam.prisma:125-126`).
- `ExamResult` is used by manage/results/marks-entry/analytics. `Result` (line 644) is generic across grades. Both are writable; nothing enforces consistency.
- **Decide & enforce:** `ExamResult` stays as exam-only result; add a constraint or trigger so `Result.examId` is `null` always (i.e., `Result` is for assignments only).

#### C4. Destructive cascade chains

| Relation                                            | Current                                    | Risk         | Fix                                |
| --------------------------------------------------- | ------------------------------------------ | ------------ | ---------------------------------- |
| `SchoolExam.class onDelete: Cascade`                | wipes all exams in deleted/archived class  | High         | `Restrict` + soft-delete `Class`   |
| `SchoolExam.subject onDelete: Cascade`              | same for subject                           | High         | `Restrict`                         |
| `ExamResult onDelete: Cascade` from SchoolExam      | losing exam loses all results              | Medium       | `Restrict`                         |
| `ExamCertificate onDelete: Cascade` from ExamResult | result delete kills proof of certification | **Critical** | `Restrict`                         |
| `Student → ExamResult/ExamCertificate Cascade`      | withdrawing student wipes academic history | High         | `Restrict` + soft-delete `Student` |

Add `deletedAt DateTime?` to `Class`, `Student`, `Subject`, `SchoolExam`. Update queries to filter `deletedAt: null`.

#### C5. Missing/insecure constraints

- `QuestionReview` (`school-qbank.prisma:429-459`) has **no `schoolId`** — review of question-bank items is effectively cross-tenant.
- `QuestionResponse` (`school-qbank.prisma:176-202`) has `schoolId, questionId, studentId, examId` as raw fields — **no `@relation` declarations** ⇒ no FK constraints, no cascades, no `include`. Either declare relations or drop the model (verify usage with `grep -rn "db.questionResponse"`).
- No `@@unique([schoolId, classId, subjectId, examDate, startTime])` on `SchoolExam` ⇒ DB allows duplicate exams in the same class/time. Conflict detection lives in app code only.
- `GradingSchemeGrade` lacks `schoolId` (`grading-scheme.prisma:32-52`); relies on join through `GradingScheme` for tenant isolation. Add defensive `schoolId`.

### D. Test depth

#### D1. ~50 / 162 E2E tests have NO `expect()` assertion

`tests/e2e/epic-10-exams/{exam-lifecycle,student-exam-taking,auto-marking,certificates-analytics}.spec.ts` — toothless tests that pass on navigation alone. Top examples:

- `auto-marking.spec.ts:111` "True/False answers are auto-graded" — body is `// Similar to MCQ` comment only.
- `student-exam-taking.spec.ts:211` "cannot submit after time expires" — no assertion.
- `student-exam-taking.spec.ts:220` "submission prevents double-submit" — no assertion.
- `student-exam-taking.spec.ts:266` "cannot retake submitted exam" — no assertion.
- `auto-marking.spec.ts:249` "grade changes are logged for audit" — comment "actual verification would be in the database", no assertion.

These give a false sense of safety. Either add real assertions or delete and rewrite.

#### D2. Critical untested paths

- `submitExamSession` — the heart of student-take flow. ZERO unit tests.
- `results/lib/calculator.ts` (22 fns: `calculateGrade`, `calculateGPA`, `calculateRanks`, `calculatePassFailStats`, …) — 0 tests.
- `results/lib/pdf-generator.ts` (10 fns) — 0 tests.
- `lib/audit.ts`, `lib/security.ts`, `lib/secure-actions.ts` — 0 tests.
- `mark/actions/{ai-grade,ocr,manual-mark,bulk-operations,rubric,submission}.ts` — 1 test file across all (`auto-mark-with-key.test.ts`).
- `take/hooks/{use-auto-save,use-exam-session,use-proctor}.ts` — 0 tests.
- All wizard step actions (40+) — 0 tests.
- Certificate verification public endpoint — 0 tests. Worst place to skip security testing.

#### D3. Cross-tenant isolation never realistically exercised

Only `notifications/__tests__/actions.test.ts` declares a `SCHOOL_B` constant — and never uses it. Every other "tenant" test relies on a mocked `findFirst` returning `null`. **No exam test seeds data in two schools and verifies isolation at runtime.**

### E. Architecture

#### E1. `page.tsx` with `"use client"` (server-component-first violation)

- `app/.../exams/new/page.tsx` — uses `"use client"` + `useEffect` to call a server action and redirect. Causes loader flash + extra client hydration cost.
- `app/.../exams/qbank/new/page.tsx` — same pattern.
- **Fix:** convert to Server Component, call `createDraftExam()` at the top, `redirect(...)` immediately. No client JS, no flash.

#### E2. Two competing wizard implementations

- `wizard/template-wizard/` (14 step dirs, primary)
- `wizard/exam-wizard-v2/` (4 step dirs, newer?)
- Both have separate `wizard-actions.ts`, `config.ts`, `labels.ts`, hooks. Routes seem to use both: `/exams/template/add/[id]/...` (template-wizard) and `/exams/generate/add/[id]/...` (exam-wizard-v2).
- **Decide:** which is canonical? Document and delete the other (or rename to `legacy-template-wizard/` and gate behind a feature flag).

---

## P1 — High priority (ship-blockers for a real load)

### Performance / N+1 (will OOM under realistic load)

1. `getStudentResults` recomputes class rank with N+1 fetches per result row (`results.ts:148-176`). Pre-fetch all results, group in JS.
2. `enterMarks` calls `calculateGrade → db.gradeBoundary.findMany` per student in a 40-row class (`marks-entry.ts:184-216`). Hoist boundary fetch.
3. `bulkGradeExam` fires 3-4 queries per answer (`bulk-operations.ts:85-118`). Batch with `createMany`/`updateMany`.
4. `bulkAdoptQuestions` fires ~5 queries per question adopted (`catalog-browse.ts:266-274`). Single transaction with pre-loaded data.
5. `submitExamSession` (`take/actions.ts:425-461`) does sequential `studentAnswer.upsert` inside a transaction → 1 round-trip per answer.
6. `importMarksFromCSV` ~600 queries for 200-row CSV.
7. `getDescendants` on `CurriculumStandard` is recursive `findMany` per node (`standards.ts:632-651`). Use a recursive CTE (`db.$queryRaw`).

### Pagination gaps (12 unbounded findMany)

- `qbank/actions/question-crud.ts:431` (getQuestions)
- `qbank/actions/generation.ts:111,269,366` (whole-bank fetches before sampling)
- `manage/actions/marks-entry.ts:33` (whole-class fetch)
- `manage/actions/results.ts:31,121` (all results / all student history)
- `analytics.ts:42,193,442` (school-wide aggregates)
- `qbank/actions/standards.ts:132` (whole curriculum tree)

### Index gaps

- `SchoolExam.title` ILIKE search → add `gin (title gin_trgm_ops)` via raw SQL migration.
- `QuestionBank.tags hasSome` → add `gin (tags)`.
- `MarkingResult.gradedAt` lacks `[schoolId, gradedAt]` compound.
- `CurriculumStandard.parentId` lacks `[schoolId, parentId]`.
- Partial index `WHERE wizard_step IS NULL` on `SchoolExam` for the dashboard list query.

### Security hardening

- **CSV injection** on export (`results/actions/csv-import-export.ts`) — no escaping of cells starting with `=`, `+`, `-`, `@`. Add `escapeCsv()`.
- **Public certificate verification** (`/exams/certificates/verify/[code]/page.tsx`) untested for replay, revoked-cert acceptance, and PII leakage. Add test + assertion.
- **OCR/CSV upload** validates file size (`mark/utils.ts:399 isValidFileSize`) but no MIME-type allowlist enforcement at action layer.
- **Prompt injection** — student answer text goes verbatim into AI grading prompt. Add `sanitizeForPrompt()` (strip system-prompt-like sequences, length limit).
- **AI prompt logging** — verify Anthropic/OpenAI keys are NEVER in logs. Audit `console.error(error)` calls in `ai-grade.ts` and `ai-generation.ts`.
- **Take/content.tsx is `"use client"`** — exam-take UI is entirely client-rendered. The score, the answer key, and the deadline must NEVER reach the client unencrypted. Audit what's serialized in initial props.

### Testing

- Add the **20 P0 tests** (see test audit, top of section) — `submitExamSession`, calculator, RBAC matrix, shuffleArray, autoGrade\*, aiGrade fallback, enterMarks, certificate verify, override audit, conflict detection, status state-machine, etc.
- Migrate the 50 toothless E2E tests to actual assertions or delete them.
- Add a real two-school integration test (seed data in school A + school B, log in as A's teacher, verify B's data is unreachable across every read+write action).

### Schema housekeeping

- Migration audit-trail gap: `Exam → SchoolExam` rename was via `db push`, no migration. Generate a no-op migration to capture state, or document explicitly in `prisma/migrations/README.md`.
- Soft-delete columns: add `deletedAt` to Class, Student, Subject, SchoolExam, QuestionBank.
- Decide `Result` vs `ExamResult` ownership and migrate.

### Architecture

- 6 files >700 lines (`paper/config-form.tsx` 984, `content.tsx` 922, `qbank/form.tsx` 829, `certificates/actions/index.ts` 814, `paper/actions/paper-generation.ts` 787, `results/actions.ts` 778). Split per single-responsibility.
- Stale docs: `README.md` and `ISSUE.md` say "Routes not wired" — they are. Update or delete.

---

## P2 — Hardening / nice-to-have

1. **Recurring exams** (weekly quizzes auto-schedule). Add cron + `RecurrencePattern` model.
2. **Drag-and-drop calendar reschedule.**
3. **Question version history** (currently overwrites).
4. **Real-time collaboration on grading** — currently last-write-wins between teachers.
5. **Plagiarism check on essay answers.**
6. **QTI import/export** for question portability.
7. **PDF builder UI** for custom result templates.
8. **Custom font upload per school** (currently locked to Cairo for Arabic).
9. **Partial credit on MCQ** (currently all-or-nothing per answer).
10. **Offline mark entry** (PWA + sync queue).
11. Status auto-transition (PLANNED→IN_PROGRESS→COMPLETED based on date).
12. Notification idempotency keys (currently double-clicks send twice).
13. Excel BOM handling on CSV import.
14. Print preview QA across Letter / A4 / A3.
15. Cross-link gradebook integration (P1 in old ISSUE.md, but actually needs schema design first).
16. `submissionType: "DIGITAL" | "PAPER" | "OCR"` enum drift — verify enum vs string usage.
17. `mock/take-actions.ts:228` answer comparison via `.toLowerCase()` will mishandle Arabic / RTL marks. Use `Intl.Collator` with `sensitivity: "accent"`.
18. Move the `paper/config-form.tsx:56-68` curriculum presets into a configurable DB table (`CurriculumPreset`) so schools can add their own.

---

## Action plan (4 phases, ~6 weeks)

### Phase 1 — Stop-the-bleed (week 1, MUST ship)

- Fix `submitExamAnswers` ID bug (#A1) — 1 hr.
- Wrap `submitExamAnswers` in transaction (#A2) — 1 hr.
- Replace in-memory rate limiter with Upstash Redis (#B1) — 1 day.
- Switch all `Class/Student/Subject` cascades from `Cascade` to `Restrict` (#C4) — 0.5 day + migration test.
- Add `lib/permissions.ts` unit tests (#B2) — 1 day.
- Add `submitExamSession` integration test (#D2) — 0.5 day.
- Delete or fix the 50 toothless E2E tests (#D1) — 1 day.
- Update `README.md` / `ISSUE.md` — 1 hr.

**Deliverable:** correctness bugs fixed, basic safety nets in place.

### Phase 2 — Schema hygiene (week 2-3)

- Add `lang` to 17 models (#C2) — 1 day.
- Drop `bodyTemplateAr/titleAr/nameEn` bilingual fields (#C1) — 2 days inc. data migration.
- Standardize on `Decimal(6,2)` for marks (#A3) — 1 day inc. migration.
- Decide `Result` vs `ExamResult` (#C3) — 1 day to design + 0.5 day migration.
- Add missing indexes (#index gaps) — 0.5 day.
- Add `@@unique` on `SchoolExam` to prevent duplicates — 0.5 day.
- Fix `QuestionResponse` relations + `QuestionReview.schoolId` (#C5) — 0.5 day.
- Generate audit-trail migration for SchoolExam rename — 0.5 day.

**Deliverable:** schema compliant with project rules; no data-loss cascades.

### Phase 3 — N+1 and pagination (week 3-4)

- Refactor 7 N+1 patterns — 4 days.
- Add pagination to 12 unbounded findMany — 2 days.
- Replace `getDescendants` with recursive CTE — 0.5 day.
- Verify with `prisma-optimizer` skill on actual schema.

**Deliverable:** dashboard + analytics queries pass at 10× current school size.

### Phase 4 — Test depth + AI safety (week 4-5)

- Add 20 P0 tests from test audit (calculator, RBAC matrix, shuffleArray, autoGrade\*, certificate verify) — 5 days.
- Add real two-school cross-tenant integration test — 1 day.
- Add `AICostUsage` model + per-school budget (#B3) — 1 day.
- Add prompt sanitizer + CSV injection escaping — 0.5 day.
- Audit page.tsx files (#E1) — 0.5 day.
- Resolve wizard duplication (#E2) — 1 day.

**Deliverable:** ~50% coverage, AI cost-controlled, security-hardened.

### Phase 5 — Sharpen (week 5-6, post-MVP)

- Pick top 5 from P2 list based on user demand.
- Performance benchmark with seeded 1000-exam school.
- Lighthouse / Core Web Vitals on `/exams`, `/exams/result`, `/exams/[id]/take`.

---

## Statistics

| Dimension      |   Files |    LOC |        Tested |      Untested |    % |
| -------------- | ------: | -----: | ------------: | ------------: | ---: |
| Block total    |     505 | 96,005 |             — |             — |    — |
| Server actions |    ~120 |   ~25k |           ~30 |         ~200+ | ~13% |
| Lib utilities  |       6 |  ~2.5k |             0 |           All |   0% |
| Hooks          |       3 |    ~1k |             0 |           All |   0% |
| Components     |    ~250 |   ~50k |            ~5 |          ~245 |  ~2% |
| E2E flows      | 5 specs |      — | ~112 asserted | ~50 toothless |  69% |

| Schema                          |                Issues |
| ------------------------------- | --------------------: |
| Missing `lang` field            |             17 models |
| Bilingual field violations      |        14 occurrences |
| Destructive cascade chains      |                     5 |
| Missing schoolId                |              2 models |
| Missing relations (orphan rows) |               1 model |
| Score type mismatch             |            1 critical |
| Index gaps                      |                    ~6 |
| Migration audit gaps            | 1 (SchoolExam rename) |

| Code                           |           Issues |
| ------------------------------ | ---------------: |
| N+1 query patterns             |               11 |
| Unbounded findMany             |               12 |
| Hardcoded English errors       |          9 files |
| Hardcoded Arabic notification  |      2 instances |
| Files > 700 lines              |                6 |
| `page.tsx` with `"use client"` |                2 |
| In-memory rate limiter         | 1 (whole module) |
| Two competing wizard impls     |                1 |
| Two parallel result models     |                1 |

---

## Files referenced (audit trail)

**Schemas:**

- `prisma/models/exam.prisma`, `school-exam.prisma`, `school-qbank.prisma`, `qbank.prisma`, `quiz.prisma`, `grading-scheme.prisma`

**Highest-risk action files (read in this audit):**

- `manage/actions/{read,crud,results,analytics,marks-entry,conflict-detection,status,secured-crud}.ts`
- `qbank/actions/{question-crud,catalog-browse,generation,standards,ai-generation}.ts`
- `mark/actions/{auto-mark,auto-mark-with-key,bulk-operations,ai-grade}.ts`
- `take/actions.ts`
- `paper/actions/{paper-config,paper-generation,catalog-paper}.ts`
- `results/actions/{batch-pdf,csv-import-export}.ts`
- `lib/{permissions,security,audit,secure-actions}.ts`
- `wizard/{template-wizard,exam-wizard-v2,cert-wizard}/wizard-actions.ts`

**Test files (read):**

- `__tests__/actions.test.ts`, `__tests__/validation.test.ts`
- `manage/__tests__/{form,status}.test.ts(x)`
- `mark/__tests__/{auto-mark-with-key,form}.test.ts(x)`
- `qbank/__tests__/form.test.tsx`
- `take/__tests__/actions.test.ts`
- `notifications/__tests__/actions.test.ts`
- `tests/e2e/epic-10-exams/{exam-lifecycle,student-exam-taking,auto-marking,multi-tenant-isolation,certificates-analytics}.spec.ts`

---

**Bottom line.** The exam block is **architecturally sound** (good RBAC abstraction, correct mirror-pattern routing, sensible sub-block separation, single-language storage idea is right) but has **5 production-stoppers** (#1 ID bug, #2 rate-limit, #5 cascade chains, #6 score type, #B1 in-memory limiter) that will surface within hours of going live, plus a thin **shell-test suite** that won't catch regressions. With the 4-phase plan above (~5–6 weeks of focused work), it's realistic to ship by **mid-June 2026** at production grade.
