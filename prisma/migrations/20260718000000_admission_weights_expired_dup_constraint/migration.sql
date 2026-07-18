-- Migration-of-record (additive only). Applied out-of-band via Neon MCP,
-- branch-first, per .claude rules — do NOT run `prisma migrate deploy`.
--
-- Three admission-flow hardening items (audit 2026-07-17, plan
-- read-admission-block-eager-kay; #376 §10 approved the last two):
--
-- 1. Merit weight defaults. The settings form's own validation requires
--    entranceWeight + interviewWeight === 100, but the column defaults were
--    40/35/25 — a freshly seeded school could not re-save its settings
--    without first editing the weights, and the docs + generateMeritList
--    fallback constants already said 60/40. academicWeight is vestigial
--    (no academic-score input; always saved 0).
--    ALTER ... SET DEFAULT is metadata-only; the backfill UPDATE touches
--    ONLY rows still sitting at the exact old default triple — a school
--    that customized its weights is never modified.
--
-- 2. EXPIRED application status. Offers past offerExpiryDate flip via the
--    daily fee-due cron (never selectable from the status dropdown); admin
--    can re-offer (EXPIRED → SELECTED in the status machine).
--    ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
--    older Postgres — run it as its own statement if a combined run errors.
--
-- 3. Duplicate-submission backstop. App code already prevents duplicates
--    (atomic session claim + duplicate-email check); this makes the DB the
--    last line. userId is nullable and Postgres treats NULLs as distinct
--    under UNIQUE, so guest/legacy rows are unaffected.
--    PRE-FLIGHT (mandatory before applying): confirm zero existing
--    duplicates on the target branch —
--      SELECT "schoolId","campaignId","userId",count(*) FROM "Application"
--      WHERE "userId" IS NOT NULL GROUP BY 1,2,3 HAVING count(*)>1;
--    If rows return, dedup first (keep newest by "createdAt"; flip older
--    ones to WITHDRAWN with a reviewNotes annotation).

-- 1. Merit weight defaults (model AdmissionSettings @@maps to
--    "admission_settings" — the one snake_case table in this file)
ALTER TABLE "admission_settings" ALTER COLUMN "academicWeight" SET DEFAULT 0;
ALTER TABLE "admission_settings" ALTER COLUMN "entranceWeight" SET DEFAULT 60;
ALTER TABLE "admission_settings" ALTER COLUMN "interviewWeight" SET DEFAULT 40;

UPDATE "admission_settings"
SET "academicWeight" = 0, "entranceWeight" = 60, "interviewWeight" = 40
WHERE "academicWeight" = 40
  AND "entranceWeight" = 35
  AND "interviewWeight" = 25;

-- 2. EXPIRED status (own statement — see header note on ALTER TYPE)
ALTER TYPE "AdmissionApplicationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- 3. Duplicate-submission unique backstop
CREATE UNIQUE INDEX IF NOT EXISTS "Application_schoolId_campaignId_userId_key"
  ON "Application" ("schoolId", "campaignId", "userId");
