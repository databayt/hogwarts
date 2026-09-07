-- Content-review notification types + the platform approval queue's index.
--
-- DEPLOYMENT NOTE (Hogwarts / Neon): this repo's migration history is EMPTY —
-- do NOT run `prisma migrate deploy`. Every recent migration here is a
-- migration-of-record, applied out-of-band via the Neon MCP (branch-first,
-- per the Branch-Before-Touch protocol) or `prisma db push` WITHOUT
-- --accept-data-loss. Precedent: 20260527000000_add_compliance_models.
--
-- ORDERING MATTERS: this must land in production BEFORE the code that writes
-- `type: 'content_review'`. Writing an enum label Postgres does not know
-- throws on every insert.
--
-- content_review        -> fired by every writer that sets
--                          Video.approvalStatus = PENDING, fanned out to
--                          every DEVELOPER (the SaaS dashboard bell).
-- content_approved /    -> fired on the platform's decision, fanned out to
-- content_rejected         the uploader + the school's ADMINs. These replace
--                          the prior abuse of document_shared / system_alert
--                          for that direction.
--
-- NOTE: Postgres requires `ALTER TYPE ... ADD VALUE` to run OUTSIDE a
-- transaction. Each is wrapped in COMMIT/BEGIN markers so a tool that runs
-- this file in a single tx closes it first.

COMMIT;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'content_review';
BEGIN;

COMMIT;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'content_approved';
BEGIN;

COMMIT;
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'content_rejected';
BEGIN;

-- Additive index (transaction-safe, unlike the enum DDL above).
-- The platform approval queue (saas-dashboard/catalog/approval-content.tsx)
-- filters WHERE "approvalStatus" = 'PENDING' with NO schoolId. Both existing
-- indexes lead with a column that query never filters on, and this queue is
-- now the single decision point for every video on the platform.
-- In a manual production apply prefer CREATE INDEX CONCURRENTLY —
-- lesson_videos is hot and CONCURRENTLY works outside this file's transaction.
CREATE INDEX IF NOT EXISTS "lesson_videos_approvalStatus_createdAt_idx"
  ON "lesson_videos"("approvalStatus", "createdAt");
