-- Live-class configuration options: consent notice, auto-publish, guardians,
-- join-muted (school default + per-session override), room tools, reminder
-- lead time, per-grade online override. Additive and guarded.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassRecordingConsentNote" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassAutoPublishRecordings" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassGuardiansObserve" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassStudentsJoinMuted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassToolChat" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassToolHands" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassToolPolls" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassToolWhiteboard" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassToolStudentShare" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "liveClassReminderLeadMinutes" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "live_class_sessions" ADD COLUMN IF NOT EXISTS "studentsJoinMuted" BOOLEAN;
ALTER TABLE "academic_grades" ADD COLUMN IF NOT EXISTS "liveClassOnline" BOOLEAN;
