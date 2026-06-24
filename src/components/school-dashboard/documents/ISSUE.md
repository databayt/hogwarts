---
title: Documents (Fill Engine)
file_type: issue
owner: Abdout
maturity: Built (v1)
last_audited: 2026-06-23
---

# Documents — Production Readiness

**Status:** BUILT (v1), migration-pending. tsc 0.

## Pending migration (additive — apply Neon-branch-first at deploy)

The `document_templates` table + enum do not exist on prod yet. The change is
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

1. Per-domain "Generate with my template" buttons — certificates list (batch-per-class) + exam paper page (single). The `generateDocument(s)` actions already exist; just wire UI + entity context.
2. Downloadable **starter `.docx`** per category (correct `{{tags}}`/`{#loops}` pre-authored) so schools don't guess docxtemplater syntax.
3. **Import a paper** — upload existing exam `.docx`/`.pdf` → AI-extract questions → review → bank. ~80% reuse of `lib/document-extraction` (`extractWithSchema`) + `saveAIGeneratedQuestions` (add a `source` param → `IMPORTED`). Add a 4th card to the exam create chooser.
4. REPORT_CARD + LETTER + RECEIPT + ID_CARD resolvers (same engine).
5. PDF output (v2) — LibreOffice headless on the Oracle VM, or CloudConvert.

## Known limits

- Templates stored **public** (school-scoped, unguessable key) — low-risk (the blank template, not student data). Filled outputs stream directly to the browser, never stored public.
- Bulk generation is synchronous (per-class ≤ ~60 ok); for scale use the existing `exams/results/actions/batch-pdf.ts` queue.
- Image/diagram-heavy content doesn't round-trip through the (future) import extraction.
