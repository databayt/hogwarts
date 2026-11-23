-- Live-class supervisors per stage + cover of a class nobody taught + the
-- no-teacher / make-up notification types. Additive and idempotent; applied by
-- hand (no _prisma_migrations table in production).

CREATE TABLE IF NOT EXISTS "live_class_supervisors" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "live_class_supervisors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "live_class_supervisors_schoolId_userId_stage_key"
  ON "live_class_supervisors"("schoolId", "userId", "stage");
CREATE INDEX IF NOT EXISTS "live_class_supervisors_schoolId_stage_idx"
  ON "live_class_supervisors"("schoolId", "stage");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_class_supervisors_schoolId_fkey'
  ) THEN
    ALTER TABLE "live_class_supervisors"
      ADD CONSTRAINT "live_class_supervisors_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_class_supervisors_userId_fkey'
  ) THEN
    ALTER TABLE "live_class_supervisors"
      ADD CONSTRAINT "live_class_supervisors_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "coveredByUserId" TEXT;
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "coveredAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "live_class_sessions_coveredByUserId_idx"
  ON "live_class_sessions"("coveredByUserId");

-- `ALTER TYPE ... ADD VALUE` must run outside a transaction (see 20260828010000).
COMMIT;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'live_class_no_teacher';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'live_class_makeup_booked';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'live_class_makeup_moved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'live_class_makeup_cancelled';
BEGIN;
