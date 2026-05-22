-- Add single-language-storage `lang` field to the admission application models
-- (see .claude/rules/translation.md). Safe additive change: NOT NULL with a
-- default, so existing rows are backfilled to 'ar' with no data loss. Applied
-- to the default Neon branch out-of-band via ADD COLUMN IF NOT EXISTS and
-- recorded with `prisma migrate resolve --applied`.

-- AlterTable
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'ar';

-- AlterTable
ALTER TABLE "ApplicationSession" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'ar';
