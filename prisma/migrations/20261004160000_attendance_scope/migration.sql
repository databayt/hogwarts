-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Attendance without classes: QR sessions and hall passes name a section.
-- classId becomes optional on both (legacy rows keep theirs). New schools have
-- no Class rows, so neither could be created there.
--
-- Additive and safe: new nullable columns, relaxed NOT NULLs, guarded FKs and
-- indexes. No data touched. Idempotent.

ALTER TABLE "qr_code_sessions" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "qr_code_sessions" ALTER COLUMN "classId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "qr_code_sessions_schoolId_sectionId_idx" ON "qr_code_sessions" ("schoolId", "sectionId");

ALTER TABLE "hall_passes" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;
ALTER TABLE "hall_passes" ALTER COLUMN "classId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "hall_passes_schoolId_sectionId_idx" ON "hall_passes" ("schoolId", "sectionId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qr_code_sessions_sectionId_fkey') THEN
    ALTER TABLE "qr_code_sessions" ADD CONSTRAINT "qr_code_sessions_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hall_passes_sectionId_fkey') THEN
    ALTER TABLE "hall_passes" ADD CONSTRAINT "hall_passes_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
