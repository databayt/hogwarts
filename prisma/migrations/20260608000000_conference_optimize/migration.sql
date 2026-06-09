-- Conference optimization — ADDITIVE migration of record.
--
-- All statements are idempotent (IF NOT EXISTS) and lock-free (CONCURRENTLY).
-- Apply at DEPLOY against the Neon default branch via the Neon MCP run_sql
-- (Neon-branch-first per the DB-safety protocol). Do NOT run via
-- `prisma db execute`/`migrate deploy` — these are out-of-band, the repo's
-- migration history is managed manually.
--
-- Physical names: Conference @@map -> live_class_sessions,
-- ConferenceLink @@map -> live_class_default_links, Section @@map -> sections.

-- attachLiveClasses hot path (every dashboard today-view): a one-day
-- scheduledStart window filtered by status, scoped by school.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "live_class_sessions_schoolId_status_scheduledStart_idx"
  ON "live_class_sessions" ("schoolId", "status", "scheduledStart");

-- attachLiveClasses resolves the active term's recurring default links.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "live_class_default_links_schoolId_termId_sectionId_idx"
  ON "live_class_default_links" ("schoolId", "termId", "sectionId");

-- Per-section recording opt-out (overrides School.conferenceRecordingDefault).
ALTER TABLE "sections"
  ADD COLUMN IF NOT EXISTS "conferenceRecordingOptOut" BOOLEAN NOT NULL DEFAULT false;
