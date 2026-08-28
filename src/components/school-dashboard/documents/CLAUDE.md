# Documents Block (Fill Engine)

## Context

"Bring your own `.docx`" template fill engine: a school uploads its mandated/official
Word template with `{{tags}}` (and `{#loops}`), the system merges real data in, and
returns the finished document. v1 outputs `.docx`. See [README](README.md) for structure
and [ISSUE](ISSUE.md) for status + the pending additive migration SQL.

## Key Decisions

- **Two rendering tracks, on purpose.** This engine (upload-and-fill) sits ALONGSIDE the
  built-in `@react-pdf` designs (region presets, `ComposableCertificate`). Presets = "we
  design it for you"; this = "bring your exact mandated format." Don't merge them.
- **`docxtemplater` with `{{ }}` delimiters** (not the default `{ }`) — matches the existing
  certificate `bodyTemplate` convention (`{{studentName}}`) and Word mail-merge habits.
  `mammoth` only READS docx; filling needs docxtemplater + pizzip.
- **`nullGetter: () => ""`** so a template referencing a tag the data doesn't supply renders
  empty instead of throwing. Loops over a missing array render nothing.
- **Resolvers are plain modules, not `"use server"`** (like the gradebook spine). They're
  imported by `generate.ts` (the action). Each maps a domain entity → the flat/loop merge
  object. Reuse existing data (e.g. the `ExamCertificate` row already has denormalised
  recipient/exam fields — no need to rebuild `CertificateForPaper`).
- **Output `.docx` in v1, no PDF.** PDF needs a converter (no infra exists); deferred to v2
  (LibreOffice on the Oracle VM). Filled docs stream to the browser as base64 → Blob.
- **Templates stored public**, school-scoped folder (the blank template is not PII). Filled
  outputs are never stored public — they download directly.
- **Adding a category** = add a `resolvers/<cat>.ts`, a `case` in `resolvers/index.ts`, a
  `FIELD_VOCAB` entry, and (optionally) a section in `templates-list.tsx`.
- **This engine is now THE template path (2026-07-18)** — the build-a-template wizards
  (exam-paper `template-wizard`, `cert-wizard`, grades report-card `builder`) were removed;
  schools upload a `.docx` instead. `RESOLVABLE_CATEGORIES` = `CERTIFICATE`, `EXAM_PAPER`,
  `REPORT_CARD` (report-card resolver reads `ReportCard` + `ReportCardGrade[]`). Per-domain
  **"Generate (my template)"** lives on the certificate list, `/exams/paper/[id]`, and the
  report-cards table via the reusable `GenerateWithTemplateButton` +
  `generateFromDefaultTemplate(category, entityId)` (picks the school's default/most-recent
  active template). Deferred: docx→PDF, HTML templates, the remaining category resolvers.
- **No standalone route — hosted by exams + grades (2026-07-20).** `/documents` and its
  sidebar entry were deleted. `content.tsx` takes a `categories` prop and is mounted at
  `/exams/templates` (`EXAM_PAPER` + `CERTIFICATE`) and `/grades/templates`
  (`REPORT_CARD`). `revalidatePath` in `actions.ts` now targets those two paths.
  `DocumentsManager` + `UploadTemplateDialog` read `dictionary.school.documents.*` —
  the hardcoded bilingual `L` objects are gone.
- **`EXAM_PAPER` has a coupling flow, not an id box (2026-07-20).** `use-exam-template-dialog.tsx`
  - `exam-paper-flow.ts` bind a layout to exam data: pick an existing `GeneratedExam`, or
    pick a blueprint (`SchoolExamTemplate`) + class + title + date and let
    `generateExamPaperFromTemplate` create `SchoolExam`+`GeneratedExam` in one transaction,
    run `autoGenerateExamQuestions`, then fill. Coverage badges intersect the template's
    detected `mergeFields` with `FIELD_VOCAB[category]` so unsupported tags are visible
    BEFORE generating. Other categories still use the entity-id input.
- **Generation is role-gated** — `generateDocument`/`generateDocumentsBulk`/
  `generateFromDefaultTemplate` require `MANAGER_ROLES` (ADMIN/DEVELOPER/TEACHER). The
  resolver scopes by `schoolId` but takes an arbitrary `entityId`, so without the gate any
  authenticated school user could fill a template with another student's row.

- **Starter `.docx` per category + bulk fill (2026-08-14)** — `starter-template.ts` builds a
  real Word file whose `{{tags}}`/`{{#loops}}` are already correct (via `lib/docx-fill/build.ts`,
  tags checked against `FIELD_VOCAB` so a typo throws instead of shipping a blank cell), served
  by the `getStarterTemplate` action and offered next to Upload + in the empty state. This is
  the way IN: an untagged upload stores happily and fills as a blank copy of itself, and a
  wrongly-braced one prints its markers — neither failure is visible until a school prints.
  `generateFromDefaultTemplateBulk(category, entityIds)` is the bulk sibling of
  `generateFromDefaultTemplate`; both bulk entry points share `fillBulk` and cap at
  `BULK_MAX_ENTITIES` (50, in `config.ts` — NOT in `generate.ts`, which is `"use server"` and
  may only export async functions). Callers chunk and download a zip part per slice.
- **`getResolverSchool` is `cache()`-wrapped** — a bulk fill reads the school once per request
  instead of once per document.

- **Loop tags are `{{#tag}}`, never `{#tag}` (2026-08-14).** The engine runs custom `{{ }}`
  delimiters, so a single-brace loop is not a loop — it prints literally, drops its body, and
  `detectMergeFields` STILL reports the inner tags, so every coverage badge in the UI looks
  correct while the paper is broken. The upload dialog taught the wrong form until this date.
  Regression guard: `starter-template.test.ts` → "single-brace loop syntax".
- **`EXAM_PAPER` offers a flat AND a sectioned body (2026-08-14).** `{{#questions}}` is one
  continuous list; `{{#sections}}` groups by question type with per-section mark totals.
  Both always resolve. Anything added to a resolver MUST be added to `FIELD_VOCAB` in the
  same commit — the Use-template coverage badge intersects detected tags with the vocabulary,
  so an undocumented tag renders as "unsupported ✗" even though it fills correctly.
- **Question selection degrades; the caller must SAY so (2026-08-14).** `generateExamQuestions`
  fills what the bank covers and records the rest — it only fails at zero. So a "success" can
  still be a short paper. `generateExamPaperFromTemplate` returns `distributionMet` /
  `missingCategories` / `totalQuestions` beside the file for exactly this reason; a caller that
  drops them ships a silently short exam.

## Danger Zones

- Every `DocumentTemplate` query + every resolver read MUST include `schoolId`
  (`getTenantContext()`) — cross-tenant leak otherwise.
- `prisma db push` is unsafe here (prod drift) — apply the additive SQL in `ISSUE.md` only.

## Related

- `src/lib/docx-fill/` — the generic fill primitives.
- `src/lib/document-extraction/` — the AI extraction layer for the future "import a paper".
- `exams/certificates`, `exams/paper` — where per-domain "Generate with my template" buttons land.

## After You Finish

1. Update `ISSUE.md` status + backlog.
2. `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`.
3. If you touched the model: apply the additive SQL Neon-branch-first.
