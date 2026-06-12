-- Additive-only migration (applied out-of-band via Neon MCP on 2026-06-12;
-- this file is the migration-of-record — DO NOT re-run prisma migrate deploy).

-- Partial-payment tracking on UserInvoice
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';
ALTER TABLE "UserInvoice" ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "UserInvoice" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

-- Index coverage
CREATE INDEX IF NOT EXISTS "invoices_schoolId_idx" ON "invoices"("schoolId");
CREATE INDEX IF NOT EXISTS "AdmissionInquiry_convertedToApplicationId_idx" ON "AdmissionInquiry"("convertedToApplicationId");
CREATE INDEX IF NOT EXISTS "ApplicationSession_convertedToApplicationId_idx" ON "ApplicationSession"("convertedToApplicationId");
