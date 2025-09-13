-- Migration script to add onboarding fields to schools table
-- Run this in your Neon database console

-- Add onboarding completion timestamp
ALTER TABLE "schools" 
ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- Add operational status field
ALTER TABLE "schools" 
ADD COLUMN IF NOT EXISTS "operationalStatus" TEXT;

-- Add safety features array field
ALTER TABLE "schools" 
ADD COLUMN IF NOT EXISTS "safetyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name IN ('onboardingCompletedAt', 'operationalStatus', 'safetyFeatures');