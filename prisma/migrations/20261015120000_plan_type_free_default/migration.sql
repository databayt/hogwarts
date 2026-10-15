-- Migration-of-record. Applied out-of-band, branch-first, per .claude rules —
-- do NOT run `prisma migrate deploy` against prod.
--
-- Plan ids follow the public pricing: free | pro | enterprise (lib/plan-type).
-- New schools default to "free". Existing rows are rewritten separately by
-- scripts/migrate-plan-types.ts (dry run first, after a Neon restore point);
-- until then every reader maps legacy ids through normalizePlanType.
-- Idempotent.

ALTER TABLE "schools" ALTER COLUMN "planType" SET DEFAULT 'free';
