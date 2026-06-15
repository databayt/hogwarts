-- Profile build-out — badges + organizations (migration-of-record)
--
-- NOTE: This project's DB history is empty; schema changes are applied additively
-- via Neon (NOT `prisma migrate deploy`). This file documents the additive delta
-- to apply to the production default branch (br-small-tooth-adscsfmb).
--
-- All statements are idempotent (IF NOT EXISTS / duplicate_object guards) and
-- purely additive — three NEW tables + two NEW enums. No existing table or data
-- is touched. Referenced tables verified against the live DB: "User" (no @@map)
-- and "schools" (School @@map).

-- Enums ----------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "ProfileBadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationType" AS ENUM ('CLUB', 'COMMITTEE', 'DEPARTMENT', 'TEAM', 'ASSOCIATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- profile_badges -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "profile_badges" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "level" "ProfileBadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "context" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "metadata" JSONB,
    CONSTRAINT "profile_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_badges_schoolId_userId_key_key"
  ON "profile_badges"("schoolId", "userId", "key");
CREATE INDEX IF NOT EXISTS "profile_badges_schoolId_userId_idx"
  ON "profile_badges"("schoolId", "userId");
CREATE INDEX IF NOT EXISTS "profile_badges_schoolId_userId_isPublic_idx"
  ON "profile_badges"("schoolId", "userId", "isPublic");

DO $$ BEGIN
  ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- organizations --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'CLUB',
    "description" TEXT,
    "avatarUrl" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "organizations_schoolId_idx"
  ON "organizations"("schoolId");

DO $$ BEGIN
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- organization_memberships ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "organization_memberships" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_memberships_organizationId_userId_key"
  ON "organization_memberships"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "organization_memberships_schoolId_userId_idx"
  ON "organization_memberships"("schoolId", "userId");
CREATE INDEX IF NOT EXISTS "organization_memberships_organizationId_idx"
  ON "organization_memberships"("organizationId");

DO $$ BEGIN
  ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
