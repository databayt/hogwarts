-- Extend NotificationTemplate unique constraint to include `lang` so EN+AR
-- rows can coexist for the same (schoolId, type, channel). Without this,
-- seeding both locales fails the unique check.
--
-- This file exists FOR RECORD ONLY. Per project convention, Hogwarts Neon
-- migrations are applied out-of-band via `prisma db push` or Neon MCP
-- `run_sql` against the default branch — never via `prisma migrate deploy`.
-- See `~/.claude/projects/-Users-abdout-hogwarts/memory/reference_db_migration_workflow.md`.

-- Drop the old narrower unique key.
ALTER TABLE "notification_templates"
  DROP CONSTRAINT IF EXISTS "notification_templates_schoolId_type_channel_key";

-- Add the new lang-aware unique key. Idempotent so reruns are safe.
ALTER TABLE "notification_templates"
  ADD CONSTRAINT "notification_templates_schoolId_type_channel_lang_key"
  UNIQUE ("schoolId", "type", "channel", "lang");
