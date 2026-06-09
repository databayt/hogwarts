-- Retire "ClickView" from the schema (see /docs/catalog#origins).
-- Renames the 3 provenance/grade-sibling columns to generic, source-agnostic names.
--
-- DEPLOY-COUPLED: apply this together with the code change that renames the Prisma
-- fields (clickviewId→subjectGroupId, clickviewUrl→sourceUrl, clickviewCoverId→coverId)
-- and their 7 readers. Local dev shares the prod Neon DB, so the column rename cannot
-- precede the deploy. RENAME COLUMN is metadata-only (instant, no table rewrite).
--
-- subjectGroupId is the "same subject across grades" grouping key the grade-toggle
-- UI queries (WHERE subjectGroupId = X). Only the US curriculum populates it today;
-- it is universal and other curricula can adopt it later.

ALTER TABLE "catalog_subjects" RENAME COLUMN "clickviewId" TO "subjectGroupId";
ALTER TABLE "catalog_subjects" RENAME COLUMN "clickviewUrl" TO "sourceUrl";
ALTER TABLE "catalog_lessons"  RENAME COLUMN "clickviewCoverId" TO "coverId";

-- If an index references the old column name, recreate it (none today; left for the record):
-- DROP INDEX IF EXISTS "catalog_subjects_clickviewId_idx";
-- CREATE INDEX IF NOT EXISTS "catalog_subjects_subjectGroupId_idx" ON "catalog_subjects"("subjectGroupId");
