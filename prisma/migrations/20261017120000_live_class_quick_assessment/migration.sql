-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- A live class can link a quick assessment the host launches in the room.
-- One nullable column + FK + index, named like its siblings. Idempotent.

ALTER TABLE "live_class_resources" ADD COLUMN IF NOT EXISTS "quickAssessmentId" TEXT;

CREATE INDEX IF NOT EXISTS "live_class_resources_quickAssessmentId_idx"
  ON "live_class_resources"("quickAssessmentId");

DO $$ BEGIN
  ALTER TABLE "live_class_resources"
    ADD CONSTRAINT "live_class_resources_quickAssessmentId_fkey"
    FOREIGN KEY ("quickAssessmentId") REFERENCES "quick_assessments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
