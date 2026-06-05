-- Compliance / regulator-submission framework (Epic 01: ADEK eSIS)
-- Generic shape — ADEK_ESIS is the first provider; future regulators add an enum value.
--
-- DEPLOYMENT NOTE (Hogwarts Neon):
--   Migration history is EMPTY in this repo — DO NOT run `prisma migrate deploy`.
--   Apply via `pnpm prisma db push` (without --accept-data-loss) on the default
--   branch. This file is kept for record + reference for fresh-database setups.

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE "ComplianceProvider" AS ENUM ('ADEK_ESIS', 'CUSTOM');
CREATE TYPE "ConnectorMode" AS ENUM ('DRY_RUN', 'PIGGYBACK', 'OFFICIAL_API', 'RPA', 'DISABLED');
CREATE TYPE "ComplianceSubmissionStatus" AS ENUM ('PENDING', 'QUEUED', 'IN_FLIGHT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FAILED', 'CANCELLED');
CREATE TYPE "CircuitBreakerState" AS ENUM ('CLOSED', 'OPEN', 'HALF_OPEN');

-- Extend existing NotificationType enum with ADEK 2h SLA value.
-- NOTE: Postgres requires `ALTER TYPE ... ADD VALUE` to run OUTSIDE a
-- transaction. Wrap this single statement in COMMIT/BEGIN markers so that
-- if a tool runs the migration in a single tx (e.g., `prisma migrate`),
-- the surrounding tx is closed first. `prisma db push` runs each
-- statement individually and is the recommended apply path for this repo.
COMMIT;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'absence_unreported_followup';
BEGIN;

-- Loosen AuditLog.userId to nullable so cron/worker/webhook system events
-- can be recorded without a synthetic user row. The FK is reattached as
-- SET NULL so deleting a real user keeps history.
ALTER TABLE "audit_logs"
    DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey",
    ALTER COLUMN "userId" DROP NOT NULL,
    ADD CONSTRAINT "audit_logs_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Per-school × provider config (opt-in, default off)
CREATE TABLE "school_compliance_configs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" "ComplianceProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "ConnectorMode" NOT NULL DEFAULT 'DRY_RUN',
    "submissionTimeUtc" TEXT NOT NULL DEFAULT '10:00',
    "parentContactSlaMinutes" INTEGER NOT NULL DEFAULT 120,
    "notifyAdminOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "sharedGroupId" TEXT,
    "providerConfig" JSONB,
    "lastSubmissionAt" TIMESTAMP(3),
    "lastSubmissionStatus" "ComplianceSubmissionStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "school_compliance_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "school_compliance_configs_schoolId_provider_key"
    ON "school_compliance_configs" ("schoolId", "provider");
CREATE INDEX "school_compliance_configs_provider_enabled_idx"
    ON "school_compliance_configs" ("provider", "enabled");

-- Group-shared credentials (Aldar piggyback shape — 1 cred row, N schools)
CREATE TABLE "shared_compliance_credential_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "ComplianceProvider" NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "circuitBreakerState" "CircuitBreakerState" NOT NULL DEFAULT 'CLOSED',
    "recentFailures" INTEGER NOT NULL DEFAULT 0,
    "circuitOpenedAt" TIMESTAMP(3),
    "rotatedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shared_compliance_credential_groups_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "shared_compliance_credential_groups_provider_idx"
    ON "shared_compliance_credential_groups" ("provider");

-- Per-school credentials (only used when mode=OFFICIAL_API)
CREATE TABLE "school_compliance_credentials" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" "ComplianceProvider" NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "secretMetadata" JSONB,
    "rotatedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "school_compliance_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "school_compliance_credentials_schoolId_provider_key"
    ON "school_compliance_credentials" ("schoolId", "provider");

-- Daily submission attempts (one row per (school, provider, date, attempt))
CREATE TABLE "compliance_submissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" "ComplianceProvider" NOT NULL,
    "submissionDate" DATE NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "mode" "ConnectorMode" NOT NULL,
    "status" "ComplianceSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "payloadStudentCount" INTEGER NOT NULL DEFAULT 0,
    "payloadAbsentCount" INTEGER NOT NULL DEFAULT 0,
    "payloadCategorized" JSONB,
    "csvArtifactUrl" TEXT,
    "csvArtifactContent" TEXT,
    "csvArtifactSha256" TEXT,
    "receiptId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "claimedByWorkerId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "claimExpiresAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "compliance_submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "compliance_submissions_schoolId_provider_submissionDate_attemptNumber_key"
    ON "compliance_submissions" ("schoolId", "provider", "submissionDate", "attemptNumber");
CREATE INDEX "compliance_submissions_provider_status_idx"
    ON "compliance_submissions" ("provider", "status");
CREATE INDEX "compliance_submissions_status_claimExpiresAt_idx"
    ON "compliance_submissions" ("status", "claimExpiresAt");
CREATE INDEX "compliance_submissions_schoolId_submissionDate_idx"
    ON "compliance_submissions" ("schoolId", "submissionDate");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE "school_compliance_configs"
    ADD CONSTRAINT "school_compliance_configs_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_compliance_configs"
    ADD CONSTRAINT "school_compliance_configs_sharedGroupId_fkey"
    FOREIGN KEY ("sharedGroupId") REFERENCES "shared_compliance_credential_groups" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "school_compliance_credentials"
    ADD CONSTRAINT "school_compliance_credentials_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_submissions"
    ADD CONSTRAINT "compliance_submissions_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_submissions"
    ADD CONSTRAINT "compliance_submissions_supersededById_fkey"
    FOREIGN KEY ("supersededById") REFERENCES "compliance_submissions" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
