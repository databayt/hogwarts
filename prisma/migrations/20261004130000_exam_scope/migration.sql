-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Exams without classes: a SchoolExam is scoped by grade + (section | whole
-- grade) + subject + term, and remembers who wrote it. classId becomes
-- optional (legacy exams keep theirs). New schools have no Class rows, so the
-- old required classId made exams impossible there (report #429).
--
-- Additive and safe: new nullable columns, a relaxed NOT NULL, guarded FKs and
-- indexes. No data touched. Idempotent.

ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "exams" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "exams" ALTER COLUMN "classId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "exams_schoolId_gradeId_idx" ON "exams" ("schoolId", "gradeId");
CREATE INDEX IF NOT EXISTS "exams_schoolId_sectionId_idx" ON "exams" ("schoolId", "sectionId");
CREATE INDEX IF NOT EXISTS "exams_schoolId_termId_idx" ON "exams" ("schoolId", "termId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_gradeId_fkey') THEN
    ALTER TABLE "exams" ADD CONSTRAINT "exams_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_sectionId_fkey') THEN
    ALTER TABLE "exams" ADD CONSTRAINT "exams_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_termId_fkey') THEN
    ALTER TABLE "exams" ADD CONSTRAINT "exams_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "terms" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
