---
epic: 03
sprint: Q3-2026
title: Grades
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 96
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-08-14
---

# Grades — Production Readiness Tracker

**Status:** BUILT — gradebook spine live, report-card PDF deferred
**Completion:** ~94%
**Last Updated:** 2026-07-19

---

## POST-deploy — one manual step owed

No DDL is owed (`document_templates` is already live). But **prod will not self-heal**:
`ensure-demo` fast-paths on an already-seeded demo so the new seed never runs, and
`/api/cron/term-end-report-cards` only generates for a term that has **zero** cards —
prod term 1 already has ~970. So after pushing, the prod demo keeps its random GPAs and
0 `ReportCardGrade` rows, i.e. exactly the bug this pass fixed.

Run once against the prod demo after deploy:

```bash
pnpm db:seed:single grades
```

(Idempotent — projects graded submissions into `Result`, re-runs the aggregation, and
publishes. A tenant admin can achieve the same from the UI: `/grades/reports` → pick the
term → **Generate report cards** → **Publish**.)

## Recently Added

- **Report-card generation made set-based; gradebook + report cards actually seeded (2026-08-14)** — `generateReportCardsCore` walked one student at a time, firing two score queries per enrolled class plus an attendance / year-level / card lookup per student, then one `updateMany` per student for the rank pass. On the demo school (972 students × 36 enrolled classes) that is **~70,000 sequential round-trips** — minutes to hours, past any server-action or cron timeout. That is why prod/demo had **0 `ReportCardGrade` rows**: nobody had ever completed a run at school scale, so every report card printed a header with an empty subject table, and the `.docx` `{{#subjects}}` loop rendered nothing for every school. Rewritten to read the whole cohort in a fixed handful of queries (classes-in-term → `studentClass` / `examResult` / `result` / `attendance.groupBy` / `academicGrade`, all `Promise.all`), aggregate in memory, resolve rank in memory so it rides the same write, and write in chunks (`createMany` for new cards, batched `$transaction` for existing, chunked `deleteMany` + `createMany` for grade rows). **Measured on the local demo: 1.02s for 970 cards / 14,738 subject grades.** Same de-dup rule (`Result` wins over `ExamResult` for the same `examId`) and same `percentageToGrade`; additionally `attendance` now filters `deletedAt: null` (soft-deleted rows had been counted).
- **`revalidatePath` moved out of the core, and every grades path fixed (2026-08-14)** — the core is called by the term-end cron and the seed, which have no request scope; revalidation now lives in the `generateReportCards` action wrapper. All grades calls used bare `"/grades/reports"`-style strings, which match no cache tag — **every grades revalidation was a silent no-op**. New `grades/lib/paths.ts` (`gradesPath`, `parentPath`) returns the internal bracketed form and every call site passes `"page"` (report-cards ×2, promotion ×5, transcripts ×1).
- **Seed derives the gradebook instead of inventing it (2026-08-14)** — the demo held ~14.3k GRADED `AssignmentSubmission` rows and ~30k `ExamResult` rows, and the unified `Result` gradebook had **2 rows**; `/grades` was empty. Report cards were seeded with a _random_ GPA, so a student with all-F exams could print an A+. `seedGradebookResults` now projects every graded submission into `Result` (scored with the spine's own `toPercentage` + `letterGradeFor` against the school's real `GradeBoundary` rows; de-duped on the spine's `assignmentId` match key, so re-runs insert nothing), and `seedReportCards` runs the production `generateReportCardsCore`. Demo now: **14,306 gradebook rows, 970 report cards, 14,738 subject grades, real ranks and attendance days** — one source of truth across the gradebook, the assignment module and the printed card. Idempotency verified (second run: 0 new rows, identical counts).
- **Bulk `.docx` report cards (2026-08-14)** — `generateDocumentsBulk` existed but was **called from nowhere**; the only path to "the school's own template" was the per-row button, i.e. ~970 clicks for a term. New `generateFromDefaultTemplateBulk(category, entityIds)` + `getReportCardIdsForTemplate({termId, gradeId})` back a **Generate all** button on the report-cards table that fills the school's default `REPORT_CARD` template for the whole filtered cohort, chunked at `BULK_MAX_ENTITIES` (50) with a live count. Chunking is not cosmetic: measured 50 cards → 406 KB zip / 541 KB base64 with a minimal template, so a whole term in one action response is tens of megabytes.

- **Term-end report-card auto-generation + cron-callable core (2026-07-19)** — extracted the aggregation into `grades/lib/report-cards-core.ts` (`generateReportCardsCore(schoolId, input)`, a plain module mirroring the gradebook-spine pattern); the `generateReportCards` action is now a thin `auth()`+`getTenantContext()` wrapper. The `/api/cron/term-end-report-cards` cron (daily 03:00) was rewritten from flag-only to actually **generate** report-card drafts for just-ended terms via the core — but only when the term has zero report cards yet, so an admin-processed term is never clobbered. It does NOT publish: the admin reviews in `/grades/reports` and clicks Publish, then `process-report-card-pdfs` renders PDFs. Also wired the `REPORT_CARD` docx template-fill (see the documents block): a new `documents/resolvers/report-card.ts` reads `ReportCard`+`ReportCardGrade[]`, surfaced as a "Generate (my template)" button on `report-cards/table.tsx`. The 4-step `grades/template/` report-card builder wizard was removed (`/grades/templates` now redirects to `/documents`). tsc 0.

---

## MVP Checklist

- [x] Report card generation (per term, per class, per student)
- [x] Report card listing and publishing
- [x] **Report card publish notification** — `publishReportCards` dispatches a `report_card_ready` notification to the class audience via `dispatchNotificationsToAudience`
- [x] **Report card dedup** — `generateReportCards` deduplicates by `examId` so re-running finalize never creates duplicate report-card rows
- [x] Transcript generation with QR verification
- [x] Certificate PDF generation (single + batch)
- [x] Composable certificate template system
- [x] Regional presets (US, Saudi, Sudan, MENA)
- [x] Promotion candidate evaluation
- [x] Promotion batch approval and execution
- [x] Promotion policy configuration (upsert)
- [x] Grade notification dispatch
- [x] Default grade boundaries (A+ through F)
- [x] **Public certificate share page** (`/[lang]/certificate/[shareToken]`) — un-stubbed; embeds the rendered PDF, no React-PDF in the public bundle
- [x] **Public certificate verify page** (`/[lang]/verify/[code]`) — un-stubbed + i18n
- [x] **Gated certificate download API** (`/api/certificates/[id]/download`) — session+JWT, schoolId-scoped, 425-until-rendered
- [x] **Favorite/default template** (`ExamCertificateConfig.isDefault` + Set-as-default UI)
- [x] **Auto-generate certificates** using the default template (`autoGenerateCertificates`)
- [x] **Async certificate-PDF cron** (`/api/cron/process-certificate-pdfs`) — decouples React-PDF render from the request
- [x] **Signature image upload** in the certificate config form
- [x] **Test coverage** for the cert engine + Block B (was ZERO) — see "Testing"
- [x] **Gradebook spine** (`grades/lib/gradebook.ts`) — shared write path for all scoring surfaces (exams, quick assessments, stream quizzes): `toPercentage`, `letterGradeFor`, `upsertExamResult`, `upsertGradebookResult`, `resolveStudentClassForSubject`
- [ ] Custom grade boundary configuration per school
- [ ] **Report-card PDF render → `reportCard.pdfUrl`** — DEFERRED (see below)

## Testing

Added ~80 Vitest cases (was 0 for this block + the cert engine):
`exams/certificates/actions/__tests__/certificate-actions.test.ts` (config CRUD,
issuance/eligibility/batch, share/verify/revoke, **default template**,
auto-generate, tenant isolation), `grades/actions/__tests__/{certificate-pdf,
report-cards,transcripts,promotion,notifications}.test.ts`,
`api/certificates/[id]/download/__tests__/route.test.ts`,
`api/cron/process-certificate-pdfs/__tests__/route.test.ts`.
Grade/cert suites: **215 green**. 0 new `tsc` errors.

Added 2026-06-14: `src/tests/school-dashboard/exams/gradebook.test.ts` — pure
unit tests for `toPercentage` (8 cases: rounding, zero-guard, negative-guard)
and `letterGradeFor` (21 cases: default fallback scale + custom boundaries +
gap handling). No DB required.

## Known Issues

### P0 — Critical

- None

### P1 — High

- Grade boundaries are hardcoded defaults -- no UI for school-specific configuration
- [x] ~~Transcript verification public page not confirmed~~ — the cert verify page
      is live; transcript public verify exists at `/[lang]/verify/transcript/[code]`

### P2 — Medium

- Batch PDF generation may timeout for large classes — MITIGATED: the
  `process-certificate-pdfs` cron renders out-of-band (`pdfUrl: null` work-queue,
  per-run cap of 25)
- Template preview in admin UI not yet available (`previewCertificate` action exists)
- Promotion override audit trail needs review

## Deferred

- **Report cards onto the favorite-template pipeline / report-card PDF render.**
  The composable certificate engine's data model (`templates/types.ts`
  `CertificateForPaper`) is **single-score** — it can't represent a multi-subject
  report card without extending the shared engine (a `subjects[]` field + a new
  scores-table variant), which would also regress certificate rendering. The
  correct path is to **server-render the existing full-fidelity
  `ReportCardTemplate`** (`src/components/file/generate/report-card.tsx`,
  `ReportCardData` in `file/generate/types.ts`) → S3 → `reportCard.pdfUrl`,
  mirroring `grades/actions/certificate-pdf.ts` (+ a `process-report-card-pdfs`
  cron and a gated `/api/.../report-cards/[id]/download` route). It needs careful
  multi-relation data assembly (class/yearLevel/term/year/subjects) best verified
  against seeded report-card data in the browser, so it's split out as its own
  task rather than shipped unverified.

## Enhancements (Post-MVP)

- GPA calculation engine with weighted/unweighted modes
- Grade analytics (class averages, distribution histograms)
- Parent/student portal for viewing report cards online
- Automated promotion recommendations based on policy rules
- Historical transcript comparison
- Certificate template designer (WYSIWYG)

---

## Resolved Issues (2026-06-14)

- **Gradebook spine shipped.** `grades/lib/gradebook.ts` provides the single
  write path for all scoring surfaces. `toPercentage` rounds to 2 dp;
  `letterGradeFor` delegates to `calculateGrade` with custom or default
  boundaries; `upsertExamResult` and `upsertGradebookResult` are idempotent;
  `resolveStudentClassForSubject` is best-effort (returns null when class can't
  be determined, caller skips the write). NOT "use server" — plain helpers.
- **Report card dedup + publish-notify.** `generateReportCards` deduplicates by
  `examId`; `publishReportCards` dispatches a `report_card_ready` notification to
  the class audience.

**Last Review:** 2026-06-14
