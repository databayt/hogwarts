-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Public marketing survey (/survey): one row per completed response.
-- A new table, no FK, no data touched. Idempotent.

CREATE TABLE IF NOT EXISTS "survey_responses" (
    "id" TEXT NOT NULL,
    "survey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "email" TEXT,
    "prospectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "survey_responses_survey_createdAt_idx" ON "survey_responses" ("survey", "createdAt");
