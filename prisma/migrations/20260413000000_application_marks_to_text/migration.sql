-- AlterTable: Change previousMarks and previousPercentage from Decimal to Text
-- These fields store grade labels like "excellent", "very-good", not numeric values
ALTER TABLE "Application" ALTER COLUMN "previousMarks" TYPE TEXT;
ALTER TABLE "Application" ALTER COLUMN "previousPercentage" TYPE TEXT;
