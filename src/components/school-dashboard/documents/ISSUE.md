---
title: Documents (Fill Engine)
file_type: issue
owner: Abdout
maturity: Built (v1)
last_audited: 2026-08-28
---

# Documents — Production Readiness

**Status:** BUILT (v1), schema LIVE on prod. tsc 0.

## Recently Added

- **A blueprint the bank cannot fill was a dead end (2026-08-28)** — a PARTIAL shortfall named the unfilled slots; a TOTAL failure returned a bare "no matching questions". The per-slot breakdown was already computed on that path — `autoGenerateExamQuestions` discarded it, and `generateExamPaperFromTemplate` dropped `details` again on the way out. Both carry it now and the dialog lists the slots under the error. **Open, not acted on:** `validateDistribution` (generate/validation.ts) is exported and called from NOWHERE, and `catalog-adopt.ts` copies a catalog distribution as `distribution as any` with no validation — so a malformed catalog blueprint would propagate silently to every school that adopts it. No such rows exist today, so the hardening is speculative; do it if you touch the adopt path.

- **A sectioned paper printed "4 5 6 7 8" then "1 2 3" (2026-08-28)** — found by running the FILL half live against the real bank, which until then had only ever been exercised with mocks. `generateExamQuestions` walks the distribution object's key order; the resolver's `sections` regroups into `SECTION_ORDER` (objective first, written last); nothing reconciled the two, so `order` — the tag the shipped starter prints — stopped ascending as soon as they disagreed. The demo blueprint listing `TRUE_FALSE` before `MULTIPLE_CHOICE` is enough to trigger it, so this is the normal case. The resolver now numbers by printed position, continuously across sections, and emits the flat `{{#questions}}` list as the sections flattened — making "both layouts number identically" true for the first time. `GeneratedExamQuestion.order` (answer key + online session) is untouched; this is display data only. **No fixture could have caught it: every one listed questions in an order that already agreed with `SECTION_ORDER`.** New `exam-paper-resolver.test.ts` (8) inverts that on purpose.

- **A broken `.docx` is caught at upload, not in the exam hall (2026-08-28)** — the three ways a school's own template fails were all silent, each confirmed against the real engine before the fix:
  1. **It does not compile.** An unclosed `{{#questions}}` (deleting the closing line in Word is enough) made `detectMergeFields` throw; `createDocumentTemplate` swallowed that in a `catch` and stored `mergeFields: []`, so the template sat in the list looking healthy while **every** fill failed — and the upload UI reported it as _"No tags found in this file"_, which is the opposite of what is wrong with it. Worse, docxtemplater wraps its diagnoses in a `multi_error` whose own `.message` is the literal string **`"Multi error"`**, and all four `catch` blocks in `generate.ts` returned `error.message` — so the teacher's entire error report was those two words.
  2. **Single-brace markers.** `{#questions}` compiles fine, prints itself into the paper as text, and drops its body — `detectMergeFields` still reports the _inner_ tags, so every coverage badge looks correct while the printed paper carries **zero questions**. Documented as a hazard since 08-14 and guarded by a test that only asserted detection _cannot_ see it; nothing actually detected it.
  3. **Misspelled tags.** `{{schoolNmae}}` compiles and fills blank forever. The upload dialog listed every detected tag as a neutral badge with no validity signal.

  **Fix:** new pure `validateDocxTemplate(buffer, knownTags)` in `lib/docx-fill/` returns `{ compiles, structuralErrors, tags, singleBraceMarkers }`, plus `docxTemplateIssues(error)` which unwraps the `multi_error` into `{ id, tag, explanation }`. `createDocumentTemplate` now screens **before** the `create`: a non-compiling file is **refused** (`TEMPLATE_INVALID` + the offending tag names in `details`) instead of stored, and a stored one comes back with `unknownFields` + `singleBraceMarkers` beside `mergeFields`. The upload dialog renders three outcomes — refused / stored-with-warnings / clean — and `generate.ts` maps any render-time `TemplateError` to `TEMPLATE_INVALID` so templates stored _before_ this screening also fail legibly.

  **Marker scan reads TEXT, not XML.** Word splits a hand-typed tag across several `<w:r>` runs on its own, so a regex over `document.xml` misses `{#questions}` entirely; the scan strips markup (headers and footers included) and joins runs first. A bare `{word}` is only flagged when it carries a `#`/`/`/`^` sigil or names a real field for that category, so ordinary prose like `{see overleaf}` is left alone.

  **i18n, same pass:** `EMPTY_BANK_MESSAGE` — the _most common_ runtime failure of this flow — was raw English (`"No matching questions in the bank for this template."`) returned as `res.error` and shown verbatim to Arabic-speaking teachers; it is now `QUESTION_BANK_EMPTY`. The three client callers (`upload-template-dialog`, `use-exam-template-dialog`, `templates-list`, and the wizard's `questions/form.tsx`) piped `res.error` straight into the UI, which with coded responses means printing `UNAUTHORIZED` at a user — all now go through `actionErrorMessage()`. `TEMPLATE_NOT_FOUND` had **no** translation in either language and fell through as a raw code; added, with `TEMPLATE_INVALID` and `QUESTION_BANK_EMPTY`, to `common.errors` in en + ar.

  `ActionResponse` gained the `details?: string` field that `actionError(code, details)` has always emitted but no caller could read.

  **Browser-verified on demo.localhost in en + ar/RTL, which caught a fourth bug the tests could not.** The Arabic warning embeds the correct syntax as an example — and braces plus the `#`/`/` sigils are bidi-NEUTRAL, so inside Arabic prose `{{/questions}}` rendered as `{{questions/}}`. The warning was teaching the exact broken syntax it warns about. Both samples (`singleBraceBody`, and `noTagsBody`'s `{{examTitle}}`, which had the same latent shape) now sit in `<code dir="ltr">` outside the sentence, matching the available-fields badges that already carried that treatment for this reason. Also confirmed end-to-end: a refused upload leaves NO row, and a warned one stores.

  Tests: new `docx-validate.test.ts` (19) — every case reproduced against the real engine, including a marker split across runs and a guard that **the starter templates pass their own gate** in all 6 category × language combinations. Block total 35 → 64 (`upload-screening.test.ts` pins the action's asymmetric branching: refuse the non-compiling file, store the other two).

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
