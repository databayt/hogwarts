-- Practice room: a per-school permanent live room. Additive only.
ALTER TABLE "schools" ADD COLUMN "liveClassPracticeRoom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "live_class_sessions" ADD COLUMN "isPractice" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "live_class_sessions_schoolId_isPractice_idx" ON "live_class_sessions"("schoolId", "isPractice");
