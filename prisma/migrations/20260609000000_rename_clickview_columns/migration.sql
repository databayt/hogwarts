-- Retire "ClickView" from the schema (see /docs/catalog#origins) — generic names.
-- subjectGroupId = the "same subject across grades" grouping key (grade-toggle).
--
-- Done as a ZERO-DOWNTIME expand→contract because the old columns are read on
-- public community pages, so a single RENAME COLUMN would 500 them during the
-- code/DB swap window.
--
-- EXPAND (applied to prod Neon at deploy, BEFORE the code that reads the new
-- names — additive, both column sets coexist, backfill is WHERE-scoped):
ALTER TABLE "catalog_subjects" ADD COLUMN IF NOT EXISTS "subjectGroupId" TEXT;
UPDATE "catalog_subjects" SET "subjectGroupId" = "clickviewId"
  WHERE "clickviewId" IS NOT NULL AND "subjectGroupId" IS NULL;
ALTER TABLE "catalog_subjects" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
UPDATE "catalog_subjects" SET "sourceUrl" = "clickviewUrl"
  WHERE "clickviewUrl" IS NOT NULL AND "sourceUrl" IS NULL;
ALTER TABLE "catalog_lessons" ADD COLUMN IF NOT EXISTS "coverId" TEXT;
UPDATE "catalog_lessons" SET "coverId" = "clickviewCoverId"
  WHERE "clickviewCoverId" IS NOT NULL AND "coverId" IS NULL;

-- (then the Prisma fields rename to subjectGroupId/sourceUrl/coverId and deploy.)

-- CONTRACT (run AFTER the new code is live and verified — DROP is destructive,
-- so apply manually with confirmation; left here as the record):
-- ALTER TABLE "catalog_subjects" DROP COLUMN IF EXISTS "clickviewId";
-- ALTER TABLE "catalog_subjects" DROP COLUMN IF EXISTS "clickviewUrl";
-- ALTER TABLE "catalog_lessons"  DROP COLUMN IF EXISTS "clickviewCoverId";
