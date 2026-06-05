---
epic: 03
sprint: Q3-2026
title: Grades
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 70
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-05-25
---

# Grades — Production Readiness Tracker

**Status:** 🟢 CERTIFICATES PRODUCTION-READY (report-card PDF deferred)
**Completion:** ~92%
**Last Updated:** 2026-05-30

---

## MVP Checklist

- [x] Report card generation (per term, per class, per student)
- [x] Report card listing and publishing
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

**Last Review:** 2026-03-19
