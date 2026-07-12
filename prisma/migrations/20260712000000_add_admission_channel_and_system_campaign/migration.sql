-- Migration-of-record (additive only). Applied out-of-band via Neon MCP,
-- branch-first, per .claude rules — do NOT run `prisma migrate deploy`.
--
-- Unifies the four student-creation paths: every student is now born from an
-- Application. Non-portal (direct-admit / bulk) students get a "shadow"
-- Application tagged with a channel, hung off a hidden per-school system
-- campaign. All ops are metadata-only ADD COLUMN ... NOT NULL DEFAULT (no table
-- rewrite on PG 11+), plus additive indexes.

-- 1. The channel enum.
DO $$ BEGIN
  CREATE TYPE "AdmissionChannel" AS ENUM (
    'PORTAL', 'ADMIN_DIRECT', 'ONBOARDING_IMPORT', 'BULK_IMPORT', 'LEGACY_BACKFILL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Application.channel (defaults every existing row to PORTAL) + lookup index.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "channel" "AdmissionChannel" NOT NULL DEFAULT 'PORTAL';
CREATE INDEX IF NOT EXISTS "Application_schoolId_channel_idx"
  ON "Application" ("schoolId", "channel");

-- 3. AdmissionCampaign.isSystemGenerated + at-most-one-system-campaign-per-school
--    (partial unique index — Prisma can't express it, so it lives only here).
ALTER TABLE "AdmissionCampaign"
  ADD COLUMN IF NOT EXISTS "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "AdmissionCampaign_one_system_per_school"
  ON "AdmissionCampaign" ("schoolId")
  WHERE "isSystemGenerated" = true;
