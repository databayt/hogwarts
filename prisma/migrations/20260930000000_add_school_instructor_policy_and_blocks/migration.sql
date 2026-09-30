-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Refs #401: prod schema drift. SchoolInstructorPolicy and InstructorBlock
-- (prisma/models/bridge.prisma) reached main without a migration, so prod has
-- neither table and components/lumos/lib/instructor-policy.ts 500s there.
--
-- Additive and safe: two brand-new tables, no data touched. Idempotent — every
-- statement is guarded, so it is a no-op where the tables already exist.

CREATE TABLE IF NOT EXISTS "school_instructor_policies" (
    "id"         TEXT NOT NULL,
    "schoolId"   TEXT NOT NULL,
    "lockedKey"  TEXT,
    "defaultKey" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "school_instructor_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "school_instructor_policies_schoolId_key"
    ON "school_instructor_policies" ("schoolId");

CREATE TABLE IF NOT EXISTS "school_instructor_blocks" (
    "id"            TEXT NOT NULL,
    "schoolId"      TEXT NOT NULL,
    "instructorKey" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "school_instructor_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "school_instructor_blocks_schoolId_idx"
    ON "school_instructor_blocks" ("schoolId");

CREATE UNIQUE INDEX IF NOT EXISTS "school_instructor_blocks_schoolId_instructorKey_key"
    ON "school_instructor_blocks" ("schoolId", "instructorKey");

-- FKs with cascade so a deleted school drops its policy and blocks. Guarded so
-- re-running is a no-op (ADD CONSTRAINT has no IF NOT EXISTS in Postgres).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'school_instructor_policies_schoolId_fkey'
  ) THEN
    ALTER TABLE "school_instructor_policies"
      ADD CONSTRAINT "school_instructor_policies_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'school_instructor_blocks_schoolId_fkey'
  ) THEN
    ALTER TABLE "school_instructor_blocks"
      ADD CONSTRAINT "school_instructor_blocks_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "schools" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
