-- Messaging performance indexes (2026-06-12)
--
-- ALREADY APPLIED to the Neon default branch (br-small-tooth-adscsfmb,
-- project square-hall-52214783) via MCP run_sql with IF NOT EXISTS.
-- This file is the migration-of-record only — the live DB is managed via
-- db push / out-of-band SQL (migration history is intentionally empty;
-- NEVER run `prisma migrate deploy` against this database).

-- Conversation list default filter: WHERE schoolId = ? AND isArchived = ?
-- ORDER BY lastMessageAt DESC (the existing [schoolId, type, lastMessageAt]
-- index does not cover isArchived).
CREATE INDEX IF NOT EXISTS "conversations_schoolId_isArchived_lastMessageAt_idx"
  ON conversations ("schoolId", "isArchived", "lastMessageAt" DESC);

-- markConversationAsRead WhatsApp sweep + retry sweep:
-- WHERE conversationId = ? AND whatsappStatus != 'read'
CREATE INDEX IF NOT EXISTS "messages_conversationId_whatsappStatus_idx"
  ON messages ("conversationId", "whatsappStatus");

-- getTypingIndicators: WHERE conversationId = ? AND startedAt >= now()-5s
CREATE INDEX IF NOT EXISTS "typing_indicators_conversationId_startedAt_idx"
  ON typing_indicators ("conversationId", "startedAt");

-- Webhook MESSAGES_UPDATE → per-recipient group delivery status sync:
-- WHERE providerMessageId = ? AND schoolId = ?
CREATE INDEX IF NOT EXISTS "message_whatsapp_deliveries_providerMessageId_idx"
  ON message_whatsapp_deliveries ("providerMessageId");

-- DB-level 1:1 dedup (closes the race the app-level check can't): one direct
-- conversation per unordered user pair per school. LEAST/GREATEST makes the
-- pair order-insensitive since the app writes (caller, other) unordered.
-- EXPRESSION index — not representable in the Prisma schema (see note below).
-- createConversation catches the P2002 from a concurrent duplicate and
-- returns the existing conversation.
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_direct_pair_key"
  ON conversations (
    "schoolId",
    LEAST("directParticipant1Id", "directParticipant2Id"),
    GREATEST("directParticipant1Id", "directParticipant2Id")
  )
  WHERE type = 'direct'
    AND "directParticipant1Id" IS NOT NULL
    AND "directParticipant2Id" IS NOT NULL;

-- Full-text search backing index for fullTextSearchMessages (queries.ts).
-- EXPRESSION index — not representable in the Prisma schema; `prisma db push`
-- may drop it because it isn't modeled. If message search gets slow, check
-- this index exists and re-run this statement.
CREATE INDEX IF NOT EXISTS "messages_content_fts_gin"
  ON messages USING GIN (to_tsvector('simple', COALESCE(content, '')));
