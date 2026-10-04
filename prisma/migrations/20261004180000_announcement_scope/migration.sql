-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Class removal S10: announcements and notification batches without classes.
--   - AnnouncementScope gains `grade` and `section` (`class` stays, legacy)
--   - an announcement (and a template) names a grade or a section
--   - a notification batch can target a grade or a section
--
-- NOT wrapped in a transaction: a new enum value can't be used in the
-- transaction that adds it, and the statements below don't need one. Run with
-- plain `psql -f` (autocommit). Additive and safe; idempotent.

ALTER TYPE "AnnouncementScope" ADD VALUE IF NOT EXISTS 'grade';
ALTER TYPE "AnnouncementScope" ADD VALUE IF NOT EXISTS 'section';

ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
CREATE INDEX IF NOT EXISTS "announcements_schoolId_gradeId_idx" ON "announcements" ("schoolId", "gradeId");
CREATE INDEX IF NOT EXISTS "announcements_schoolId_sectionId_idx" ON "announcements" ("schoolId", "sectionId");

ALTER TABLE "announcement_templates" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "announcement_templates" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

ALTER TABLE "notification_batches" ADD COLUMN IF NOT EXISTS "targetGradeId" TEXT;
ALTER TABLE "notification_batches" ADD COLUMN IF NOT EXISTS "targetSectionId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_gradeId_fkey') THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_sectionId_fkey') THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "announcements_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
