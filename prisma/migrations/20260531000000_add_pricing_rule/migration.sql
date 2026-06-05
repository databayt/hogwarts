-- Pricing matrix: admin-authored, sparse per-(grade × stream × studentType)
-- fee rules consumed by src/lib/fee-provisioning.ts. Applied out-of-band to the
-- Neon default branch (br-small-tooth-adscsfmb) via targeted CREATE TABLE IF
-- NOT EXISTS — the project's migration history is empty and the DB is managed
-- by db push / out-of-band SQL, so this file is a record, not an applied step.

CREATE TABLE IF NOT EXISTS "PricingRule" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "name" TEXT,
  "gradeId" TEXT,
  "academicStreamId" TEXT,
  "studentType" "StudentType",
  "tuitionFee" DECIMAL(10,2) NOT NULL,
  "admissionFee" DECIMAL(10,2),
  "registrationFee" DECIMAL(10,2),
  "examFee" DECIMAL(10,2),
  "libraryFee" DECIMAL(10,2),
  "laboratoryFee" DECIMAL(10,2),
  "sportsFee" DECIMAL(10,2),
  "transportFee" DECIMAL(10,2),
  "hostelFee" DECIMAL(10,2),
  "otherFees" JSONB,
  "installments" INTEGER NOT NULL DEFAULT 4,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PricingRule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PricingRule_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "academic_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PricingRule_academicStreamId_fkey" FOREIGN KEY ("academicStreamId") REFERENCES "academic_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PricingRule_schoolId_academicYear_idx" ON "PricingRule"("schoolId", "academicYear");
CREATE INDEX IF NOT EXISTS "PricingRule_gradeId_idx" ON "PricingRule"("gradeId");
CREATE INDEX IF NOT EXISTS "PricingRule_academicStreamId_idx" ON "PricingRule"("academicStreamId");
