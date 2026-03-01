-- Rename system → curriculum on catalog_subjects
ALTER TABLE "catalog_subjects" RENAME COLUMN "system" TO "curriculum";

-- Add new columns to catalog_subjects
ALTER TABLE "catalog_subjects" ADD COLUMN IF NOT EXISTS "schoolTypes" TEXT[] DEFAULT '{}';
ALTER TABLE "catalog_subjects" ADD COLUMN IF NOT EXISTS "concept" TEXT;

-- Add concept column to catalog_chapters
ALTER TABLE "catalog_chapters" ADD COLUMN IF NOT EXISTS "concept" TEXT;

-- Add concept column to catalog_lessons
ALTER TABLE "catalog_lessons" ADD COLUMN IF NOT EXISTS "concept" TEXT;

-- Rename clickview → us-k12
UPDATE "catalog_subjects" SET "curriculum" = 'us-k12' WHERE "curriculum" = 'clickview';

-- Update index: drop old, create new
DROP INDEX IF EXISTS "catalog_subjects_country_system_idx";
CREATE INDEX "catalog_subjects_country_curriculum_idx" ON "catalog_subjects"("country", "curriculum");

-- Rename system → curriculum on schools table
ALTER TABLE "schools" RENAME COLUMN "system" TO "curriculum";
