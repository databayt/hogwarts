-- School delivery mode (physical / online / hybrid) + attendance-from-presence thresholds.
-- Additive and guarded: safe to re-run, safe against a prod that already has parts of it.

DO $$ BEGIN
  CREATE TYPE "LiveClassDeliveryMode" AS ENUM ('physical', 'online', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassDeliveryMode" "LiveClassDeliveryMode" NOT NULL DEFAULT 'physical';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassLateGraceMinutes" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassMinPresenceMinutes" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassEarlyLeaveMinutes" INTEGER NOT NULL DEFAULT 10;

-- Backfill from the behaviour each school has TODAY, so nothing changes on deploy:
--   online  = every section online, nothing overriding it
--   hybrid  = the school default is online but sections opt out, or a window / overrides exist
--   physical = the rest
UPDATE "schools" s
SET "liveClassDeliveryMode" = 'online'
WHERE s."liveClassDeliveryMode" = 'physical'
  AND s."liveClassOnlineDefault" = true
  AND s."liveClassOnlineFrom" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "sections" x WHERE x."schoolId" = s.id AND x."liveClassOnline" IS NOT NULL);

UPDATE "schools" s
SET "liveClassDeliveryMode" = 'hybrid'
WHERE s."liveClassDeliveryMode" = 'physical'
  AND (
    s."liveClassOnlineDefault" = true
    OR s."liveClassOnlineFrom" IS NOT NULL
    OR EXISTS (SELECT 1 FROM "sections" x WHERE x."schoolId" = s.id AND x."liveClassOnline" IS NOT NULL)
  );
