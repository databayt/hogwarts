-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- "Contact under name" for the parents listing: phone (default) or email under
-- each parent's name. One column with a default, no data touched. Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "guardianNameContact" TEXT NOT NULL DEFAULT 'phone';
