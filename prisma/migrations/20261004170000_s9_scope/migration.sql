-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Class removal S9: competitions, quick assessments and progress-report
-- schedules without classes.
--   - a competition entry is a section (classId optional; legacy rows keep it)
--   - a quick assessment names an audience like exams: grade, optional
--     section (null = the whole grade), term (classId optional)
--   - a progress-report schedule is scoped to a grade or a section; neither
--     means the whole school (classId stays as legacy)
--
-- Additive and safe: new nullable columns, relaxed NOT NULLs, guarded FKs,
-- indexes and one unique index. No data touched. Idempotent.

ALTER TABLE "class_competition_entries" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "class_competition_entries" ALTER COLUMN "classId" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "class_competition_entries_competitionId_sectionId_key" ON "class_competition_entries" ("competitionId", "sectionId");
CREATE INDEX IF NOT EXISTS "class_competition_entries_schoolId_sectionId_idx" ON "class_competition_entries" ("schoolId", "sectionId");

ALTER TABLE "quick_assessments" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "quick_assessments" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "quick_assessments" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "quick_assessments" ALTER COLUMN "classId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "quick_assessments_schoolId_gradeId_idx" ON "quick_assessments" ("schoolId", "gradeId");
CREATE INDEX IF NOT EXISTS "quick_assessments_schoolId_sectionId_idx" ON "quick_assessments" ("schoolId", "sectionId");

ALTER TABLE "progress_report_schedules" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "progress_report_schedules" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
CREATE INDEX IF NOT EXISTS "progress_report_schedules_schoolId_gradeId_idx" ON "progress_report_schedules" ("schoolId", "gradeId");
CREATE INDEX IF NOT EXISTS "progress_report_schedules_schoolId_sectionId_idx" ON "progress_report_schedules" ("schoolId", "sectionId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_competition_entries_sectionId_fkey') THEN
    ALTER TABLE "class_competition_entries" ADD CONSTRAINT "class_competition_entries_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quick_assessments_gradeId_fkey') THEN
    ALTER TABLE "quick_assessments" ADD CONSTRAINT "quick_assessments_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quick_assessments_sectionId_fkey') THEN
    ALTER TABLE "quick_assessments" ADD CONSTRAINT "quick_assessments_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quick_assessments_termId_fkey') THEN
    ALTER TABLE "quick_assessments" ADD CONSTRAINT "quick_assessments_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "terms" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'progress_report_schedules_gradeId_fkey') THEN
    ALTER TABLE "progress_report_schedules" ADD CONSTRAINT "progress_report_schedules_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'progress_report_schedules_sectionId_fkey') THEN
    ALTER TABLE "progress_report_schedules" ADD CONSTRAINT "progress_report_schedules_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
