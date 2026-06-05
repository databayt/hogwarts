-- Add the `isDefault` flag to exam_certificate_configs — the school's
-- "favorite" certificate template that auto-generation selects by default.
--
-- This was applied to the live Neon DB out-of-band via the additive,
-- idempotent statements below (project square-hall-52214783, default branch
-- br-small-tooth-adscsfmb). This file exists as the migration-of-record;
-- the repo's migration history is otherwise managed via `prisma db push`
-- (see MEMORY: reference_db_migration_workflow). Do NOT run
-- `prisma migrate deploy` against Neon.

ALTER TABLE "exam_certificate_configs"
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "exam_certificate_configs_schoolId_isDefault_idx"
  ON "exam_certificate_configs" ("schoolId", "isDefault");
