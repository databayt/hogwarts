---
title: Documents (Fill Engine)
file_type: readme
owner: Abdout
maturity: Built (v1)
last_audited: 2026-06-23
---

# Documents — bring-your-own `.docx` template fill engine

Schools upload their **own** `.docx` template (their mandated/official format) with
`{{placeholder}}` tags — and `{#loop}…{/loop}` sections for repeating content — and
the system merges real school data into it, returning a finished document. v1
outputs filled **`.docx`** (no PDF infra; most schools print from Word). PDF is a
documented v2 (LibreOffice on the Oracle VM).

This complements the built-in `@react-pdf` designs (region presets, `ComposableCertificate`):
presets = "we design it for you"; this engine = "bring your mandated format, we fill it."

## Routes

| Route        | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `/documents` | Template manager — upload, see detected fields, set default, delete, generate |

## Structure

```
documents/
├── content.tsx              # server — fetches templates, renders manager
├── templates-list.tsx       # client — DocumentsManager (sections per category)
├── upload-template-dialog.tsx # client — upload .docx + field vocab reference
├── actions.ts               # createDocumentTemplate / list / setDefault / delete
├── generate.ts              # generateDocument / generateDocumentsBulk (→ base64 .docx/.zip)
├── field-vocab.ts           # canonical {{tag}} vocabulary per category
└── resolvers/
    ├── index.ts             # resolveDocumentData(category, entityId, ctx) dispatcher
    ├── certificate.ts       # ExamCertificate id → flat merge data
    ├── exam-paper.ts        # GeneratedExam id → exam meta + questions[] loop
    └── util.ts              # ResolverCtx, formatDate, toLabelledOptions
```

Generic fill primitives live at `src/lib/docx-fill/` (`fillDocxTemplate`,
`detectMergeFields`, `loadTemplateBufferFromUrl`) — pure, reusable, mirrors
`src/lib/document-extraction/`.

## Data model

`DocumentTemplate` (`prisma/models/document-template.prisma`, `@@map("document_templates")`):
`{ schoolId, category (CERTIFICATE|EXAM_PAPER|REPORT_CARD|LETTER|RECEIPT|ID_CARD|CUSTOM),
name, storageKey, fileUrl, mergeFields[], lang, isDefault, isActive, createdBy }`.
The uploaded `.docx` blob is stored via the existing `uploadFile` (public, school folder);
this row is the registry + detected merge-field list.

## Reuse

- Upload: `useUpload` (`@/components/file/upload/use-upload`), `uploadFile`.
- Fill: `docxtemplater` + `pizzip` (`{{ }}` delimiters), `jszip` for bulk ZIP.
- Cert data: the `ExamCertificate` row already carries denormalised recipient/exam fields.
- Exam data: `GeneratedExam` → exam + questions.

## Status

- **Built:** fill primitives; `DocumentTemplate` model; template CRUD; field detection;
  CERTIFICATE + EXAM_PAPER resolvers; single + bulk-ZIP generation; manager UI with a
  generate-by-id flow; `/documents` route + sidebar entry. tsc 0.
- **Migration:** additive — see `ISSUE.md` for the SQL. Apply **Neon-branch-first** at deploy.
- **Deferred (fast-follows):** per-domain "Generate with my template" buttons (certificates
  list, exam paper page); downloadable starter `.docx` per category; REPORT_CARD / LETTER /
  RECEIPT resolvers; PDF output (v2, Oracle VM LibreOffice); the "Import a paper" feature
  (extract questions from an uploaded exam — specced in the plan, ~80% reuse of
  `lib/document-extraction`).

## Test

`admin@databayt.org` on `demo.localhost:3000` → `/documents` → upload a cert `.docx`
with `{{studentName}}` / `{{grade}}` / `{{date}}` → detected fields show → paste an
`ExamCertificate` id → Generate → a filled `.docx` downloads (check Arabic name + RTL).
