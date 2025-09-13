-- Add onboarding fields to School model
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "operationalStatus" TEXT;
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "safetyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];