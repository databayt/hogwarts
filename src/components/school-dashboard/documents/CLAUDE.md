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
