-- Live Classes — dual-provider extension (migration-of-record)
--
-- NOTE: This project's DB history is empty; schema changes are applied additively
-- via Neon MCP, NOT `prisma migrate deploy`. This file documents what was applied
-- to the production default branch (br-small-tooth-adscsfmb) on 2026-06-04.
--
-- The 4 base live_class_* tables, their enums, the 4 School config columns, and
-- the 5 NotificationType values already existed on the default branch (they were
-- pushed by the original (reverted) LiveKit feature and survived the code revert).
-- This migration adds ONLY the dual-provider + stable-default-link delta.

-- New provider discriminator enum
DO $$ BEGIN
  CREATE TYPE "LiveClassProvider" AS ENUM ('livekit', 'external');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- External-link + per-session-override columns; roomName now nullable (external sessions have no SFU room)
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "provider" "LiveClassProvider" NOT NULL DEFAULT 'livekit';
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "meetingProvider" TEXT;
ALTER TABLE "live_class_sessions" ALTER COLUMN "roomName" DROP NOT NULL;

-- Index that backs the timetable Join-button lookup (school + section + subject + time)
CREATE INDEX IF NOT EXISTS "live_class_sessions_schoolId_sectionId_subjectId_scheduledS_idx"
  ON "live_class_sessions"("schoolId", "sectionId", "subjectId", "scheduledStart");

-- Stable recurring meeting link per (subject, section, term)
CREATE TABLE IF NOT EXISTS "live_class_default_links" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "provider" "LiveClassProvider" NOT NULL DEFAULT 'external',
    "meetingUrl" TEXT NOT NULL,
    "meetingProvider" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "live_class_default_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "live_class_default_links_schoolId_sectionId_idx"
  ON "live_class_default_links"("schoolId", "sectionId");
CREATE UNIQUE INDEX IF NOT EXISTS "live_class_default_links_schoolId_subjectId_sectionId_termI_key"
  ON "live_class_default_links"("schoolId", "subjectId", "sectionId", "termId");

DO $$ BEGIN
  ALTER TABLE "live_class_default_links" ADD CONSTRAINT "live_class_default_links_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "live_class_default_links" ADD CONSTRAINT "live_class_default_links_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "catalog_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "live_class_default_links" ADD CONSTRAINT "live_class_default_links_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
