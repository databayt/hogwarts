-- Bulk people import: history / undo / resume (2026-10-05).
-- Additive and idempotent: safe to re-run. Restore point first on prod.

-- Teachers and staff may have no email (guards, drivers, most rural staff);
-- the import used to invent `name.id@school.local` to satisfy NOT NULL.
-- Postgres unique indexes allow many NULLs, so (schoolId, emailAddress) holds.
ALTER TABLE "teachers" ALTER COLUMN "emailAddress" DROP NOT NULL;
ALTER TABLE "staff_members" ALTER COLUMN "emailAddress" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "import_batches" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "options" JSONB,
    "payload" JSONB,
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "createdById" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "undoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "import_batch_records" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_batch_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "import_batches_schoolId_createdAt_idx" ON "import_batches"("schoolId", "createdAt");
CREATE INDEX IF NOT EXISTS "import_batch_records_batchId_idx" ON "import_batch_records"("batchId");
CREATE INDEX IF NOT EXISTS "import_batch_records_schoolId_idx" ON "import_batch_records"("schoolId");

DO $$ BEGIN
  ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "import_batch_records" ADD CONSTRAINT "import_batch_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
