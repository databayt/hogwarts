-- Add fileSize (bytes) to lesson_videos for the per-school storage quota service.
-- Additive + nullable; applied out-of-band on the Neon default branch and
-- recorded here (this repo manages schema via db push / out-of-band SQL).
ALTER TABLE "lesson_videos" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
