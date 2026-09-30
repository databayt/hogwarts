-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- Refs #401: TwentyInboundEvent (prisma/models/funnel.prisma) reached main
-- without a migration. Prod's table was created by hand on 2026-08-29 after the
-- funnel receiver and hourly cron had 500'd since 08-18; this records it so a
-- fresh database gets it too.
--
-- Additive and safe: brand-new table, no FKs, no data touched. Idempotent, so
-- it is a no-op on prod where the table already exists.

CREATE TABLE IF NOT EXISTS "twenty_inbound_events" (
    "id"            TEXT NOT NULL,
    "webhookId"     TEXT NOT NULL,
    "eventName"     TEXT NOT NULL,
    "objectName"    TEXT NOT NULL,
    "recordId"      TEXT NOT NULL,
    "eventDate"     TIMESTAMP(3) NOT NULL,
    "updatedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payload"       JSONB NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'pending',
    "processedAt"   TIMESTAMP(3),
    "note"          TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "twenty_inbound_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "twenty_inbound_events_status_createdAt_idx"
    ON "twenty_inbound_events" ("status", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "twenty_inbound_events_webhookId_eventDate_recordId_key"
    ON "twenty_inbound_events" ("webhookId", "eventDate", "recordId");
