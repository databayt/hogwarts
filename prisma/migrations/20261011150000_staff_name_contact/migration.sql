-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- "Contact under name" for the staff listing: email (default, today's line) or
-- phone under each staff member's name. One column with a default. Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "staffNameContact" TEXT NOT NULL DEFAULT 'email';
