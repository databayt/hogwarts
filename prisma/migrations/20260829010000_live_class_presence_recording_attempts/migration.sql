-- Live classes — presence across reconnects, recording lifecycle, quiz attempts,
-- offline downloads (migration-of-record; applied additively via psql on 2026-08-29).
--
-- Every statement is idempotent and additive. New columns are nullable or defaulted.

-- Presence accumulates across reconnects (the webhook used to overwrite joinedAt).
ALTER TABLE "live_class_participants"
  ADD COLUMN IF NOT EXISTS "activeSince"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reconnectCount" INTEGER NOT NULL DEFAULT 0;

-- Recording failure reason + the lumos Video it was published into.
ALTER TABLE "live_class_recordings"
  ADD COLUMN IF NOT EXISTS "failureReason"    TEXT,
  ADD COLUMN IF NOT EXISTS "publishedVideoId" TEXT;

-- Explicit opt-in for offline download.
ALTER TABLE "lesson_videos"
  ADD COLUMN IF NOT EXISTS "allowDownload" BOOLEAN NOT NULL DEFAULT false;

-- Lesson-quiz attempts, client-supplied id → idempotent offline sync.
CREATE TABLE IF NOT EXISTS "lesson_quiz_attempts" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "schoolId"        TEXT,
  "catalogLessonId" TEXT NOT NULL,
  "answers"         JSONB NOT NULL,
  "score"           INTEGER NOT NULL,
  "total"           INTEGER NOT NULL,
  "percentage"      DOUBLE PRECISION NOT NULL,
  "source"          TEXT NOT NULL DEFAULT 'online',
  "submittedAt"     TIMESTAMP(3) NOT NULL,
  "syncedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lesson_quiz_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lesson_quiz_attempts_userId_catalogLessonId_submittedAt_idx"
  ON "lesson_quiz_attempts"("userId", "catalogLessonId", "submittedAt");
CREATE INDEX IF NOT EXISTS "lesson_quiz_attempts_schoolId_catalogLessonId_idx"
  ON "lesson_quiz_attempts"("schoolId", "catalogLessonId");
DO $$ BEGIN
  ALTER TABLE "lesson_quiz_attempts" ADD CONSTRAINT "lesson_quiz_attempts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "lesson_quiz_attempts" ADD CONSTRAINT "lesson_quiz_attempts_catalogLessonId_fkey"
    FOREIGN KEY ("catalogLessonId") REFERENCES "catalog_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
