-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- School → Configuration → "Contact under name": what the listings show under
-- a person's name ("email" | "phone"). Default keeps today's email line.
-- One column with a default, no data touched. Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "nameContact" TEXT NOT NULL DEFAULT 'email';
