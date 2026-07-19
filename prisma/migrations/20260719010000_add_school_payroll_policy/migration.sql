-- Migration-of-record (additive only). Applied out-of-band via Neon MCP,
-- branch-first, per .claude rules — do NOT run `prisma migrate deploy`.
--
-- Adds SchoolPayrollPolicy: the per-school override that makes country payroll
-- rules "adjustable in config" (owner requirement). A school's rules default
-- from its resolved country pack (registry); a row here overrides any field
-- (country, tax brackets, SS rates). Absence = pure country pack.
--
-- Deploy ordering is decoupled: loadPayrollOverride() catches P2021/P2022 and
-- returns "no override", so the reading code (payroll + salary hot paths) is
-- safe to ship before this lands. This migration makes the settings form's
-- upsert succeed and overrides take effect.
--
-- Additive and safe: brand-new table, no data touched. SchoolPayrollPolicy has
-- no @@map, so the physical table is "SchoolPayrollPolicy"; the School model
-- IS mapped, so its physical table is "schools".

CREATE TABLE IF NOT EXISTS "SchoolPayrollPolicy" (
    "id"                         TEXT NOT NULL,
    "schoolId"                   TEXT NOT NULL,
    "countryOverride"            TEXT,
    "taxBrackets"                JSONB,
    "socialSecurityEmployeeRate" DECIMAL(5, 2),
    "socialSecurityEmployerRate" DECIMAL(5, 2),
    "updatedBy"                  TEXT,
    "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchoolPayrollPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolPayrollPolicy_schoolId_key"
    ON "SchoolPayrollPolicy" ("schoolId");

CREATE INDEX IF NOT EXISTS "SchoolPayrollPolicy_schoolId_idx"
    ON "SchoolPayrollPolicy" ("schoolId");

-- FK with cascade so a deleted school drops its override. Guarded so re-running
-- is a no-op (ADD CONSTRAINT has no IF NOT EXISTS in Postgres).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SchoolPayrollPolicy_schoolId_fkey'
  ) THEN
    ALTER TABLE "SchoolPayrollPolicy"
      ADD CONSTRAINT "SchoolPayrollPolicy_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
