-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- "Contact under name" for the membership listing: phone (default) or email
-- under each member's name. One column with a default. Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "memberNameContact" TEXT NOT NULL DEFAULT 'phone';
