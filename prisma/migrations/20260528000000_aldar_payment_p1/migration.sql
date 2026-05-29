-- Aldar UAE payment readiness — P1 production gates
--
-- Scope:
--   P1.1 — Denormalize `currency` onto FeeStructure / FeeAssignment / Payment / Receipt
--          so payment receipts stay correct after a school changes School.currency.
--   P1.3 — Persist Tap's source.payment_method as Payment.gatewayMethod for audit.
--   P1.4 — Extend PaymentMethod enum with APPLE_PAY / GOOGLE_PAY / MADA / KNET / ATM_DEPOSIT
--          so Tap charges (Apple Pay, mada, KNET) don't lose their wallet identity to OTHER.
--
-- DEPLOYMENT NOTE (Hogwarts Neon):
--   Migration history is EMPTY in this repo — DO NOT run `prisma migrate deploy`.
--   These statements were applied via Neon MCP run_sql on default branch
--   br-small-tooth-adscsfmb (project square-hall-52214783) on 2026-05-28.
--   This file is kept for record + reference for fresh-database setups.

-- ============================================================================
-- P1.1 — currency snapshot columns (additive, nullable, backfilled from
-- School.currency for existing rows).
-- ============================================================================

ALTER TABLE "FeeStructure" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "FeeAssignment" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Receipt" ADD COLUMN IF NOT EXISTS "currency" TEXT;

UPDATE "FeeStructure" fs
SET "currency" = s."currency"
FROM "schools" s
WHERE fs."schoolId" = s."id" AND fs."currency" IS NULL;

UPDATE "FeeAssignment" fa
SET "currency" = s."currency"
FROM "schools" s
WHERE fa."schoolId" = s."id" AND fa."currency" IS NULL;

UPDATE "Payment" p
SET "currency" = s."currency"
FROM "schools" s
WHERE p."schoolId" = s."id" AND p."currency" IS NULL;

UPDATE "Receipt" r
SET "currency" = s."currency"
FROM "schools" s
WHERE r."schoolId" = s."id" AND r."currency" IS NULL;

-- ============================================================================
-- P1.3 — Payment.gatewayMethod
-- ============================================================================

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "gatewayMethod" TEXT;

-- ============================================================================
-- P1.4 — Extend PaymentMethod enum.
--
-- Postgres requires `ALTER TYPE ... ADD VALUE` to run OUTSIDE a transaction.
-- Wrap each in COMMIT/BEGIN markers so tools that run the migration in a
-- single tx (e.g., `prisma migrate`) close the surrounding tx first.
-- `prisma db push` runs each statement individually and is the recommended
-- apply path for this repo.
-- ============================================================================

COMMIT;
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'APPLE_PAY';
BEGIN;

COMMIT;
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'GOOGLE_PAY';
BEGIN;

COMMIT;
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MADA';
BEGIN;

COMMIT;
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'KNET';
BEGIN;

COMMIT;
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ATM_DEPOSIT';
BEGIN;
