-- Migration-of-record (additive only). Applied out-of-band via Neon MCP,
-- branch-first, per .claude rules — do NOT run `prisma migrate deploy`.
--
-- Adds the socialSecurityAmount deduction column to SalarySlip. The finance
-- maturity pass (SUDAN tax + social-security) writes this field on every
-- generated slip; the model already carries it, this lands the column.
--
-- Additive and safe: NOT NULL with a 0 default backfills existing rows to 0.
-- SalarySlip has no @@map, so the physical table is "SalarySlip".

ALTER TABLE "SalarySlip"
  ADD COLUMN IF NOT EXISTS "socialSecurityAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0;
