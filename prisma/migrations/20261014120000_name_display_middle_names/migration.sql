-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Name display (#434): a school picks how listings and profiles show a person —
-- given + second (father's) name, or given + family name. Teachers, guardians
-- and staff gain the middle-name column students already have, so the second
-- name is stored instead of dropped. Login usernames become unique per school.
-- Idempotent.

ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "nameDisplay" TEXT NOT NULL DEFAULT 'first-second';
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "middleName" TEXT;
ALTER TABLE "guardians" ADD COLUMN IF NOT EXISTS "middleName" TEXT;
ALTER TABLE "staff_members" ADD COLUMN IF NOT EXISTS "middleName" TEXT;

-- Login codes (YY + 4-digit serial, one counter per school) must be unique per
-- school. `username` also carries display names (632 duplicate pairs in prod
-- on 2026-10-14), so the index covers ONLY 6-digit codes.
CREATE UNIQUE INDEX IF NOT EXISTS "User_schoolId_login_code_key"
  ON "User" ("schoolId", "username")
  WHERE "username" ~ '^[0-9]{6}$' AND "schoolId" IS NOT NULL;
