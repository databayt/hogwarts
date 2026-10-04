-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Class removal S12: a fee structure charges a grade. FeeStructure gains
-- gradeId (classId stays, legacy). Backfill:
-- prisma/sql/class-removal/03-fee-structures-grade.sql.
--
-- Additive and safe: a nullable column, an index and a guarded FK.
-- No data touched. Idempotent.

ALTER TABLE "FeeStructure" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
CREATE INDEX IF NOT EXISTS "FeeStructure_schoolId_gradeId_idx" ON "FeeStructure" ("schoolId", "gradeId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FeeStructure_gradeId_fkey') THEN
    ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_gradeId_fkey"
      FOREIGN KEY ("gradeId") REFERENCES "academic_grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
