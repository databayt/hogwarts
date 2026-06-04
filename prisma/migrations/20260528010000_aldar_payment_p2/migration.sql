-- Aldar UAE payment readiness — P2 feature parity
--
-- Scope:
--   P2.1 — PaymentStatus.PENDING_VERIFICATION + deposit-slip / bank-branch
--          / depositor-IBAN columns for manual bank-transfer + ATM-deposit
--          capture. Verification stamps (`verifiedAt`, `verifiedBy`)
--          already exist on the model from a prior migration.
--   P2.2 — uses the PaymentMethod.ATM_DEPOSIT enum value added in P1.4.
--
-- DEPLOYMENT NOTE (Hogwarts Neon):
--   Migration history is EMPTY in this repo — DO NOT run `prisma migrate deploy`.
--   These statements were applied via Neon MCP run_sql on default branch
--   br-small-tooth-adscsfmb (project square-hall-52214783) on 2026-05-28.
--   This file is kept for record + reference for fresh-database setups.

-- ============================================================================
-- P2.1 — Offline-payment capture fields (additive, nullable).
-- ============================================================================

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "depositSlipUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "depositBankBranch" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "depositorIban" TEXT;

-- ============================================================================
-- P2.1 — PaymentStatus.PENDING_VERIFICATION.
--
-- Postgres requires `ALTER TYPE ... ADD VALUE` to run OUTSIDE a transaction.
-- ============================================================================

COMMIT;
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
BEGIN;
