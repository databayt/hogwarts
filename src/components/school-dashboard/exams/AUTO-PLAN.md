# Exam + Grade Automation — Implementation Plan

> Goal: schools configure exam & grade **templates**, then the system **auto-generates**
> exams from the question bank and **auto-marks** submissions, **auto-generates grades**
> (report cards), with everything **printable + shareable**, seamless **reminders/notifications**,
> and coverage of **small quizzes + LMS (stream)**. Template wizards must be **compact**
> (one minimal band per step, e.g. a pure header table-grid — not a full A4 page).

Status legend: ⬜ todo · 🟦 in progress · ✅ done · ⏸ deferred

---

## What already exists (do NOT rebuild)

- **Auto-gen algorithm**: `generate/utils.ts:generateExamQuestions()` (distribution + Bloom + seeded RNG + catalog fallback). Not wired into wizard.
- **Auto-mark**: `mark/actions/auto-mark-with-key.ts` (MCQ/TF/FILL), `mark/actions/ai-grade.ts` (essay/short via OpenAI), `bulk-auto-grade-all.ts`. Answer-key builder has a bug (reads missing `questionIds`).
- **Paper PDF**: `paper/actions/paper-generation.ts` (@react-pdf → S3, multi-version, answer key).
- **Results PDF**: `results/lib/pdf-generator.ts`.
- **Templates DB**: `SchoolExamTemplate` (distribution/bloom/blockConfig/scoringConfig/printConfig). Catalog `ExamTemplate`.
- **Grades**: `Result` (unified) + `ExamResult`; `generateReportCards()` (avg + GPA + rank); `Transcript`; composable cert templates; promotion.
- **Notifications**: `dispatchNotification`/`dispatchTemplated`; channels in_app/email/whatsapp/push/sms; `grade_posted` type; many reminder crons.
- **Wizard infra**: `src/components/form/wizard/` (`WizardConfig`, `createWizardProvider`, `WizardLayout`, `WizardStep`), `MiniPaperMockup`/`SectionCard` CSS mockups, `@dnd-kit`.

---

## Phase A — Exam auto-generation wired end-to-end ✅

- ✅ `questions/auto-generate.ts`: `autoGenerateExamQuestions(generatedExamId)` — load exam→template distribution → run `generateExamQuestions` over QuestionBank (+catalog fallback) → write `GeneratedExamQuestion` with real per-question points → return coverage report.
- ✅ `questions/coverage.ts`: `getTemplateCoverage(generatedExamId)` — show "have N / need M" per slot before generating.
- ✅ Wire "Auto-generate from template" button into `questions/form.tsx` + `content.tsx`.

## Phase B — Auto-marking → result loop (close submit→mark→result→grade) ✅

- ✅ Fix `getOrCreateAnswerKey` to read `GeneratedExamQuestion` relation (was reading missing `questionIds`).
- ✅ `mark/actions/finalize.ts`: `finalizeExamResults(examId, { publish })` — batch auto-grade objective + (opt) AI subjective → aggregate `MarkingResult` per student → upsert `ExamResult` + `Result` (gradebook) with letter grade from boundaries → dispatch `grade_posted` to student+guardian.
- ✅ `submitExamSession`: after writing answers, if exam is fully objective, fire instant auto-mark + ExamResult (seamless); else mark pending.
- ✅ "Auto-mark & publish" surfaced in `mark/` content.

## Phase C — Stream / quiz → gradebook bridge ✅

- ✅ `submitQuickResponse` (quick assessments): write a `Result` row (type quiz) for non-anonymous responses with a score.
- ✅ `stream/.../submitLessonQuiz`: grade lesson catalog questions, persist a lightweight `Result` (subject-scoped, "LMS quiz") so LMS practice rolls into grades.
- ✅ Shared helper `writeQuizResult()` so all quiz surfaces funnel into one gradebook path.

## Phase D — Grade templates + auto-generate + printable/shareable ✅

- ✅ Schema (additive): `ReportCard.shareToken/isPublic/viewCount`; `SchoolGradingConfig.reportCardTemplate Json?` + `reportCardStyle` + `regionPreset`.
- ✅ Wire deferred report-card PDF render → S3 → `pdfUrl`; `shareReportCard()` → public `/[lang]/report-card/[token]` route.
- ✅ `generateReportCards` already auto-generates; add notify + (opt) auto-PDF.

## Phase E — Compact template wizards ✅

- ✅ Exam-template wizard: compact single-band steps (header / student-info / instructions / footer / answer-sheet as **table-grid** SectionCard pickers, not A4). Collapse setup into compact grids.
- ✅ Grade-template wizard: compact steps (header band, scores-grid band, footer band, preview) reusing `MiniPaperMockup` style.

## Phase F — Reminders / notifications seamless ✅

- ✅ `api/cron/exam-reminders` — notify upcoming exams (student+guardian, in_app+email+whatsapp).
- ✅ Results-published + report-card-published notifications wired into finalize/publish paths.

## Phase G — Docs, block records, tests ✅

- ✅ Update block README/ISSUE/CLAUDE (exams, grades, stream, notifications).
- ✅ Docs en(+ar) where present.
- ✅ Unit tests for auto-gen coverage + finalize aggregation + quiz-result bridge.

---

## Outcome (2026-06-14) — SHIPPED to local main (UNCOMMITTED, deploy-pending)

Final gate **green**: `tsc` 0 feature errors (6 pre-existing `saas-dashboard` errors
only, unrelated); i18n ratchet + parity suites pass; new gradebook + auto-generate
tests pass (2 files). Built solo (spine + A + B + E) + a 4-agent workflow (C/D/F/G).

Key files:

- Spine: `grades/lib/gradebook.ts`
- A: `exams/wizard/exam-wizard-v2/questions/auto-generate.ts` + `questions/form.tsx` button
- B: `exams/mark/actions/finalize.ts` (+ `finalize-button.tsx`), answer-key fix in
  `mark/actions/auto-mark-with-key.ts`, instant-grade in `take/actions.ts`
- C: `exams/quick/actions/index.ts` (submitQuickResponse), `stream/dashboard/lesson/quiz-actions.ts`
- D: `grades/actions/report-cards.ts` (dedup+notify), `grades/actions/share.ts`,
  `app/[lang]/report-card/[token]/page.tsx`
- E: `grades/template/*` + `app/.../grades/templates/page.tsx` + grades nav link
- F: `app/api/cron/exam-reminders/route.ts` + `vercel.json`
- G: `src/tests/school-dashboard/exams/{gradebook,auto-generate-coverage}.test.ts` + block records

**DEPLOY-PENDING (DB additive — apply at deploy, never `migrate deploy`):**

- `ReportCard.shareToken/shareExpiry/isPublic/viewCount`
- `SchoolGradingConfig.reportCardTemplate/reportCardStyle/reportCardRegionPreset`
  Apply via Neon MCP `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` on the default branch
  (`prisma generate` already run locally so tsc passes; columns not yet on Neon).

**Follow-ups:** localize `grades/template` builder (add `school.gradeTemplate.*` en+ar,
~35 keys); wire the stream lesson-quiz client widget to call `submitLessonQuiz`; surface
`shareReportCard`/`revokeReportCardShare` buttons in the report-cards table UI.

## Invariants / safety

- Every query scoped by `schoolId`.
- DB additive only (CREATE/ALTER … IF NOT EXISTS); apply to Neon at **deploy** (deploy-pending), `prisma generate` now so tsc passes.
- No bilingual fields; dictionary keys for UI; `dispatchNotification` for all notifies.
- Reuse `generateExamQuestions`, `batchAutoGradeWithKey`, `generateReportCards` — wire, don't duplicate.
