-- Readiness: record HOW each person uses the platform (native app vs web,
-- which OS, app version, last seen). Additive and idempotent; applied by hand
-- (no _prisma_migrations table in production).

ALTER TABLE "live_class_participants" ADD COLUMN IF NOT EXISTS "client" VARCHAR(8);
ALTER TABLE "live_class_participants" ADD COLUMN IF NOT EXISTS "platform" VARCHAR(12);
ALTER TABLE "live_class_participants" ADD COLUMN IF NOT EXISTS "appVersion" INTEGER;

ALTER TABLE "login_attempts" ADD COLUMN IF NOT EXISTS "client" VARCHAR(8);

CREATE TABLE IF NOT EXISTS "user_activity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "schoolId" TEXT,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "lastClient" VARCHAR(8),
  "lastPlatform" VARCHAR(12),
  "lastAppVersion" INTEGER,
  "lastAppAt" TIMESTAMP(3),
  "lastAndroidWebAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_activity_userId_key" ON "user_activity"("userId");
CREATE INDEX IF NOT EXISTS "user_activity_schoolId_lastSeenAt_idx"
  ON "user_activity"("schoolId", "lastSeenAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_activity_userId_fkey'
  ) THEN
    ALTER TABLE "user_activity"
      ADD CONSTRAINT "user_activity_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_activity_schoolId_fkey'
  ) THEN
    ALTER TABLE "user_activity"
      ADD CONSTRAINT "user_activity_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
