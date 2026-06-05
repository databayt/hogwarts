-- Per-recipient WhatsApp delivery rows for a message — enables group fan-out
-- retry + per-recipient delivery status (the scalar whatsapp* columns on
-- "messages" can only represent a single 1:1 recipient). See the messaging
-- block ISSUE.md (group WhatsApp P0). Applied out-of-band to the Neon default
-- branch (br-small-tooth-adscsfmb) via CREATE TABLE IF NOT EXISTS — the
-- project's migration history is empty and the DB is managed by db push /
-- out-of-band SQL, so this file is a record, not an applied step.

CREATE TABLE IF NOT EXISTS "message_whatsapp_deliveries" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "providerMessageId" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "message_whatsapp_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "message_whatsapp_deliveries_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "message_whatsapp_deliveries_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "conversation_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "message_whatsapp_deliveries_messageId_participantId_key" ON "message_whatsapp_deliveries"("messageId", "participantId");
CREATE INDEX IF NOT EXISTS "message_whatsapp_deliveries_schoolId_idx" ON "message_whatsapp_deliveries"("schoolId");
CREATE INDEX IF NOT EXISTS "message_whatsapp_deliveries_status_idx" ON "message_whatsapp_deliveries"("status");
CREATE INDEX IF NOT EXISTS "message_whatsapp_deliveries_messageId_idx" ON "message_whatsapp_deliveries"("messageId");
