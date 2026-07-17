-- Migration-of-record (additive only). Applied out-of-band via Neon MCP,
-- branch-first, per .claude rules — do NOT run `prisma migrate deploy`.
--
-- Unblocks payment for Sudan schools (SD / SDG), where there is currently no
-- working payment path at all: Stripe rejects SDG, Tap does not cover SD, and
-- the Bankak provider is a permanently-unconfigured scaffold, so the parent's
-- payment picker resolves to an empty list.
--
-- Neither Bankak (Bank of Khartoum) nor Cashi/MyCashi publishes a self-serve
-- merchant API, so both are modelled as MANUAL rails: the school publishes an
-- account/QR, the payer transfers and submits a reference + screenshot, and the
-- bursar verifies. Rail identity rides on the existing free-text
-- Payment.gatewayMethod column (same as Tap uses for MADA/KNET/Apple Pay), so
-- there is deliberately NO PaymentMethod enum change here.
--
-- Every op is metadata-only ADD COLUMN / CREATE ... IF NOT EXISTS (no table
-- rewrite on PG 11+). The UserInvoice.shareToken unique index is safe on a
-- populated table: the column is new and nullable, so every existing row is
-- NULL, and Postgres permits unlimited NULLs under a UNIQUE constraint.

-- 1. School-level payment rails + reminder ladder.
--    School-scoped (not AdmissionSettings) because BOTH admission (registration
--    fee on offer acceptance) and finance (tuition invoices) consume these.
CREATE TABLE IF NOT EXISTS "school_payment_settings" (
  "id"                   TEXT NOT NULL,
  "schoolId"             TEXT NOT NULL,

  "bankakEnabled"        BOOLEAN NOT NULL DEFAULT false,
  "bankakAccountName"    TEXT,
  "bankakAccountNumber"  TEXT,
  "bankakQrUrl"          TEXT,
  "bankakInstructions"   TEXT,

  "cashiEnabled"         BOOLEAN NOT NULL DEFAULT false,
  "cashiAccountName"     TEXT,
  "cashiMerchantCode"    TEXT,
  "cashiQrUrl"           TEXT,
  "cashiInstructions"    TEXT,

  -- Replaces the hardcoded FEE_DUE_WINDOW_DAYS / REMINDER_INTERVAL_DAYS
  -- constants in the fee-due / fee-overdue crons.
  "reminderLadderDays"   INTEGER[] NOT NULL DEFAULT ARRAY[7, 3, 1],
  "overdueLadderDays"    INTEGER[] NOT NULL DEFAULT ARRAY[1, 7, 14, 30],
  "bursarEscalationDays" INTEGER DEFAULT 14,

  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,

  CONSTRAINT "school_payment_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "school_payment_settings_schoolId_key"
  ON "school_payment_settings" ("schoolId");

DO $$ BEGIN
  ALTER TABLE "school_payment_settings"
    ADD CONSTRAINT "school_payment_settings_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Registration-fee proof of payment (manual rails). Registration-fee state
--    lives on flat Application columns, not a Payment row — this mirrors
--    Payment.depositSlipUrl for the admission side.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "registrationFeeProofUrl" TEXT;

-- 3. Shareable public invoice (mirrors the ReportCard / ExamCertificate share
--    pattern). The token IS the authorization — the public route looks up by
--    shareToken alone, so it must be globally unique.
ALTER TABLE "UserInvoice"
  ADD COLUMN IF NOT EXISTS "shareToken"  TEXT,
  ADD COLUMN IF NOT EXISTS "shareExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isPublic"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "viewCount"   INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "UserInvoice_shareToken_key"
  ON "UserInvoice" ("shareToken");
CREATE INDEX IF NOT EXISTS "UserInvoice_shareToken_idx"
  ON "UserInvoice" ("shareToken");
