-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- School → Configuration → "Contact under name": what the teachers and students
-- listings show under a person's name ("email" | "phone"). The defaults keep
-- today's lines — email for teachers, phone for students.
-- Two columns with defaults, no data touched. Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "teacherNameContact" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "studentNameContact" TEXT NOT NULL DEFAULT 'phone';
