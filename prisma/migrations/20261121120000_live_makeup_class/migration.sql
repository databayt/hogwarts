-- Make-up class («حصة تعويضية»): a live class links to the cancelled / never-started
-- class it replaces. Additive and idempotent; applied by hand (no _prisma_migrations
-- table in production).
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "makeupForId" TEXT;

CREATE INDEX IF NOT EXISTS "live_class_sessions_schoolId_makeupForId_idx"
  ON "live_class_sessions"("schoolId", "makeupForId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_class_sessions_makeupForId_fkey'
  ) THEN
    ALTER TABLE "live_class_sessions"
      ADD CONSTRAINT "live_class_sessions_makeupForId_fkey"
      FOREIGN KEY ("makeupForId") REFERENCES "live_class_sessions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
