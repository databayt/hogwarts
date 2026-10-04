-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Subject teachers: who teaches which subject to which section, per term
-- (prisma/models/subject-teacher.prisma). Replaces the teacher role of the
-- Class model, which is being retired. A row exists only once a subject in a
-- section has a teacher; a missing row means "waiting for a teacher".
--
-- Additive and safe: one brand-new table, no data touched. Idempotent — every
-- statement is guarded, so it is a no-op where the table already exists.

CREATE TABLE IF NOT EXISTS "subject_teachers" (
    "id"           TEXT NOT NULL,
    "schoolId"     TEXT NOT NULL,
    "termId"       TEXT NOT NULL,
    "sectionId"    TEXT NOT NULL,
    "subjectId"    TEXT NOT NULL,
    "teacherId"    TEXT NOT NULL,
    "assignedById" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subject_teachers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subject_teachers_schoolId_termId_sectionId_subjectId_key"
    ON "subject_teachers" ("schoolId", "termId", "sectionId", "subjectId");

CREATE INDEX IF NOT EXISTS "subject_teachers_schoolId_termId_teacherId_idx"
    ON "subject_teachers" ("schoolId", "termId", "teacherId");

CREATE INDEX IF NOT EXISTS "subject_teachers_schoolId_sectionId_idx"
    ON "subject_teachers" ("schoolId", "sectionId");

-- FKs cascade: a deleted school/term/section/subject drops its assignments, and
-- a deleted teacher returns their subjects to "waiting". Guarded so re-running
-- is a no-op (ADD CONSTRAINT has no IF NOT EXISTS in Postgres).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_teachers_schoolId_fkey') THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_teachers_termId_fkey') THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "terms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_teachers_sectionId_fkey') THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_teachers_subjectId_fkey') THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "catalog_subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subject_teachers_teacherId_fkey') THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "subject_teachers_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "teachers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
