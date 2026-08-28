---
title: Documents (Fill Engine)
file_type: issue
owner: Abdout
maturity: Built (v1)
last_audited: 2026-08-14
---

# Documents — Production Readiness

**Status:** BUILT (v1), schema LIVE on prod. tsc 0.

## Recently Added

- **Sectioned exam papers + honest shortfall reporting (2026-08-14)** — the `EXAM_PAPER` resolver used to expose one flat `questions` loop, which cannot express how a real paper reads. It now also supplies `{{#sections}}` (questions grouped by type in a fixed pedagogical order — objective first, written last) with a per-section mark total and `count`, plus `startTime` / `endTime` / `instructions` / `questionCount` / `sectionCount`. Every question gained `type` / `typeLabel` / `isMcq` / `hasOptions` and `answerLines` (blank ruled space sized by type: essay 8, short answer 3, fill-blank 1). Questions keep their paper-wide `order` inside a section AND carry `numberInSection`, so both layouts number identically. `FIELD_VOCAB.EXAM_PAPER` grew in lockstep — the Use-template coverage badge intersects detected tags with the vocabulary, so a tag missing from the vocab shows as "unsupported" even though it fills. **Bug fixed on the way through:** `points` is a Prisma `Decimal`, and the resolver passed the object straight into the template; now `Number()`-ed.

  **The upload dialog was teaching broken syntax.** It rendered loop tags as `{#tag}` while the engine is configured with `{{ }}` delimiters. Under those delimiters `{#questions}` is not a loop: it prints **literally** into the finished paper, its body is dropped — and `detectMergeFields` still reports the inner tags, so the coverage badges look healthy. Badge and `loopHint` now show `{{#tag}}`, and `starter-template.test.ts` carries a regression guard for the whole failure mode.

  **Shortfall is no longer silent.** `generateExamQuestions` always degraded (fills what the bank covers, records `missingCategories`) — the P1 in `exams/generate/ISSUE.md` claiming a hard failure was stale, and is now corrected there. But `generateExamPaperFromTemplate` discarded that metadata and the dialog closed on download, so an under-stocked bank handed a teacher a short paper with nothing said. The action now returns `GeneratedPaper` (`distributionMet` / `missingCategories` / `totalQuestions` beside the file) and the dialog holds open to name the unfilled slots. `"existing"` mode runs no selection and so carries no shortfall. Tests: `exam-paper-flow.test.ts` 6 → 9.

- **Starter `.docx` + bulk fill wired (2026-08-14)** — closes backlog item 2 and the second half of item 1. `lib/docx-fill/build.ts` emits a minimal but valid WordprocessingML package (paragraphs of a single run each, so no tag is ever split across runs — the classic reason a hand-typed template silently stops matching); `starter-template.ts` lays out `EXAM_PAPER` / `CERTIFICATE` / `REPORT_CARD` with tags taken from `FIELD_VOCAB` through a checking `tagger()`, so an unknown tag throws at build time rather than shipping a blank cell. Served by the `getStarterTemplate` action in the school's `preferredLanguage`, offered as **Starter template** next to Upload and in the empty state (`starter-button.tsx`). **`generateDocumentsBulk` existed since 06-23 but was called from NOWHERE** — the only route to a school's own template was the per-row button, ~970 clicks for a term of report cards. New `generateFromDefaultTemplateBulk(category, entityIds)` shares `fillBulk` with it and backs a **Generate all** button on the grades report-cards table (`getReportCardIdsForTemplate` supplies the filtered cohort). Both bulk paths now cap at `BULK_MAX_ENTITIES` = 50 — measured: 50 report cards → 406 KB zip / 541 KB base64 with a minimal template, so an uncapped term would be tens of megabytes in one action response. The constant lives in `config.ts`, **not** `generate.ts`, which is `"use server"` and may only export async functions. `getResolverSchool` is now `cache()`-wrapped so a bulk fill reads the school once instead of once per document.

- **Templates moved into exams + grades; `/documents` deleted (2026-07-20)** — the standalone `/documents` route and its sidebar entry are gone. `content.tsx` takes a `categories` prop and is mounted at `/exams/templates` (`EXAM_PAPER` + `CERTIFICATE`, staff-only tab) and `/grades/templates` (`REPORT_CARD`). `DocumentsManager` + `UploadTemplateDialog` now read `dictionary.school.documents.*` instead of hardcoded bilingual `L` objects. **New coupling flow for exam papers:** `use-exam-template-dialog.tsx` + `exam-paper-flow.ts` replace the paste-an-entity-id box — pick an existing `GeneratedExam`, or pick a blueprint + class + title + date and `generateExamPaperFromTemplate` creates `SchoolExam`+`GeneratedExam` in one transaction, runs `autoGenerateExamQuestions`, then fills; **it rolls the exam pair back** if selection or fill fails, so a failed generate never leaves an empty exam on the schedule. Coverage badges intersect detected `mergeFields` with `FIELD_VOCAB`. Tests: `src/tests/school-dashboard/documents/exam-paper-flow.test.ts` (6).
- **This engine is now THE template path + REPORT_CARD resolver + role-gating (2026-07-18)** — the build-a-template WIZARDS (exam-paper `template-wizard`, `cert-wizard`, grades report-card `builder`) were removed; certs / exam papers / report cards are now "upload a `.docx` under `/documents` → auto-fill." `RESOLVABLE_CATEGORIES` = `CERTIFICATE`, `EXAM_PAPER`, `REPORT_CARD` (new `resolvers/report-card.ts` reads `ReportCard`+`ReportCardGrade[]`). Per-domain **"Generate (my template)"** lives on the certificate list, `/exams/paper/[id]`, and the report-cards table via the reusable `GenerateWithTemplateButton` + a new `generateFromDefaultTemplate(category, entityId)` action (picks the school's default/most-recent active template). **SECURITY:** `generateDocument`/`generateDocumentsBulk`/`generateFromDefaultTemplate` are now role-gated to `MANAGER_ROLES` (ADMIN/DEVELOPER/TEACHER) — the resolver scopes by `schoolId` but takes an arbitrary `entityId`, so without the gate any authenticated school user could fill a template with another student's row. The react-pdf region-preset track + `config-form` are kept (two rendering tracks, on purpose). **Deferred:** docx→PDF conversion, HTML template format, remaining category resolvers (TRANSCRIPT/LETTER/RECEIPT/ID_CARD — vocab already scaffolded in `field-vocab.ts`).

## Migration — APPLIED (verified 2026-07-20)

~~Pending.~~ `document_templates` + `DocumentTemplateCategory` **exist on prod**
(acct#2), verified 2026-07-20 via the `vercel env pull --environment=production` →
`psql "$DIRECT_URL"` lane: table present, enum present, all 14 columns match
`prisma/models/document-template.prisma`, 0 rows. **No DDL is owed for this block.**
The SQL below is kept only as the reference for provisioning a fresh environment.

The change was
**purely additive** (1 table + 1 enum + 1 FK to `schools`) — no existing table is
touched. Do NOT run `prisma db push` (the prod DB has pre-existing drift; db push
would try to reconcile all of it). Apply this targeted SQL on a Neon branch first,
verify, then on main:

```sql
DO $$ BEGIN
  CREATE TYPE "DocumentTemplateCategory" AS ENUM
    ('CERTIFICATE','EXAM_PAPER','REPORT_CARD','LETTER','RECEIPT','ID_CARD','CUSTOM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "document_templates" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "category" "DocumentTemplateCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "storageKey" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mergeFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lang" TEXT NOT NULL DEFAULT 'ar',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_templates_schoolId_category_idx"
  ON "document_templates" ("schoolId","category");

DO $$ BEGIN
  ALTER TABLE "document_templates"
    ADD CONSTRAINT "document_templates_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
```

`prisma/models/document-template.prisma` is the source of truth; this SQL mirrors it.

## Done (2026-06-23)

- `pnpm add docxtemplater pizzip jszip`.
- `DocumentTemplate` model + enum + `School.documentTemplates` reverse relation.
- `lib/docx-fill/` primitives (`{{ }}` delimiters, `nullGetter` → empty, `InspectModule` field detect).
- Template CRUD (`actions.ts`) + single/bulk-ZIP generation (`generate.ts`).
- CERTIFICATE + EXAM_PAPER resolvers; `field-vocab.ts`.
- Manager UI (`/documents`) + sidebar entry (ADMIN/STAFF/TEACHER).

## Backlog (fast-follows, in order)

1. ~~Per-domain "Generate with my template" buttons~~ — DONE. Single-entity buttons landed 2026-07-18; the batch path landed 2026-08-14 as **Generate all** on `/grades/reports`. Still to do: the same batch button on the certificates list (per class).
2. ~~Downloadable **starter `.docx`** per category~~ — DONE 2026-08-14 (`starter-template.ts` + `getStarterTemplate`, `{{tags}}`/`{{#loops}}` pre-authored, offered next to Upload and in the empty state).
3. **Import a paper** — upload existing exam `.docx`/`.pdf` → AI-extract questions → review → bank. ~80% reuse of `lib/document-extraction` (`extractWithSchema`) + `saveAIGeneratedQuestions` (add a `source` param → `IMPORTED`). Add a 4th card to the exam create chooser.
4. REPORT_CARD + LETTER + RECEIPT + ID_CARD resolvers (same engine).
5. PDF output (v2) — LibreOffice headless on the Oracle VM, or CloudConvert.

## Known limits

- Templates stored **public** (school-scoped, unguessable key) — low-risk (the blank template, not student data). Filled outputs stream directly to the browser, never stored public.
- Bulk generation is synchronous and hard-capped at `BULK_MAX_ENTITIES` (50) per call — callers chunk and download one zip part per slice, so a 970-card term is 20 downloads, not one. For a single-artifact-at-scale path use the existing `exams/results/actions/batch-pdf.ts` queue.
- Image/diagram-heavy content doesn't round-trip through the (future) import extraction.
