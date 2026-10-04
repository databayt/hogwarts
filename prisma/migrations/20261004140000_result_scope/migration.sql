-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Gradebook without classes: a Result row carries the student's section and
-- grade and the term it was earned in. classId becomes optional (legacy rows
-- keep theirs). Exams set for a grade or section have no class, so their
-- scores could not reach the gradebook or report cards.
--
-- Additive and safe: new nullable columns, a relaxed NOT NULL, guarded FKs and
-- indexes. No data touched. Idempotent.

ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "academicGradeId" TEXT;
ALTER TABLE "results" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "results" ALTER COLUMN "classId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "results_schoolId_termId_studentId_idx" ON "results" ("schoolId", "termId", "studentId");
CREATE INDEX IF NOT EXISTS "results_schoolId_sectionId_idx" ON "results" ("schoolId", "sectionId");
CREATE INDEX IF NOT EXISTS "results_schoolId_academicGradeId_idx" ON "results" ("schoolId", "academicGradeId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_sectionId_fkey') THEN
    ALTER TABLE "results" ADD CONSTRAINT "results_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_academicGradeId_fkey') THEN
    ALTER TABLE "results" ADD CONSTRAINT "results_academicGradeId_fkey"
      FOREIGN KEY ("academicGradeId") REFERENCES "academic_grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_termId_fkey') THEN
    ALTER TABLE "results" ADD CONSTRAINT "results_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "terms" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
