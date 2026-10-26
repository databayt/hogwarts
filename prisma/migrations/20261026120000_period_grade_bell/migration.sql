-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Per-grade bells: a period may belong to one grade (gradeId) instead of the
-- whole school, and may carry no clock time (untimed). Existing rows keep
-- gradeId NULL = school-wide, so every school behaves as before. The name
-- unique key gains gradeId; NULLS NOT DISTINCT keeps school-wide names unique
-- exactly as the old key did. Idempotent.

ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "gradeId" TEXT;
ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "untimed" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "periods" ADD CONSTRAINT "periods_gradeId_fkey"
    FOREIGN KEY ("gradeId") REFERENCES "academic_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "periods_schoolId_yearId_gradeId_name_key"
  ON "periods"("schoolId", "yearId", "gradeId", "name") NULLS NOT DISTINCT;
DROP INDEX IF EXISTS "periods_schoolId_yearId_name_key";
CREATE INDEX IF NOT EXISTS "periods_schoolId_gradeId_idx" ON "periods"("schoolId", "gradeId");
