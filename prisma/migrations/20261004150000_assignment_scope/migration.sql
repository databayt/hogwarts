-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Assignments without classes: a SchoolAssignment is scoped by grade +
-- (section | whole grade) + subject + term, and remembers who set it.
-- classId becomes optional (legacy assignments keep theirs). New schools have
-- no Class rows, so the required classId made assignments impossible there.
--
-- Additive and safe: new nullable columns, a relaxed NOT NULL, guarded FKs and
-- indexes. No data touched. Idempotent.

ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "termId" TEXT;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "assignments" ALTER COLUMN "classId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "assignments_schoolId_gradeId_idx" ON "assignments" ("schoolId", "gradeId");
CREATE INDEX IF NOT EXISTS "assignments_schoolId_sectionId_idx" ON "assignments" ("schoolId", "sectionId");
CREATE INDEX IF NOT EXISTS "assignments_schoolId_subjectId_idx" ON "assignments" ("schoolId", "subjectId");
CREATE INDEX IF NOT EXISTS "assignments_schoolId_termId_idx" ON "assignments" ("schoolId", "termId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_gradeId_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_sectionId_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_subjectId_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "catalog_subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignments_termId_fkey') THEN
    ALTER TABLE "assignments" ADD CONSTRAINT "assignments_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "terms" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
