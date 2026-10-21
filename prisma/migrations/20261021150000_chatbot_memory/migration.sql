-- Migration-of-record (additive only). Applied out-of-band, branch-first, per
-- .claude rules — do NOT run `prisma migrate deploy` against prod.
--
-- The chatbot's memory: profiles (a member, or an anonymous browser by the
-- sha256 of its cookie), threads, messages and learned notes. Four new
-- tables and three enums; nothing existing changes. Idempotent: generated
-- with `prisma migrate diff`, then wrapped so a re-run is a no-op.

DO $$ BEGIN
  CREATE TYPE "ChatbotMode" AS ENUM ('saasMarketing', 'schoolSite', 'schoolSupport');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChatbotThreadStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChatbotRole" AS ENUM ('USER', 'ASSISTANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chatbot_profiles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "keyHash" TEXT,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_profiles_pkey" PRIMARY KEY ("id")
);

-- A profile is a member or a browser, never both, never neither.
DO $$ BEGIN
  ALTER TABLE "chatbot_profiles" ADD CONSTRAINT "chatbot_profiles_one_identity_chk"
    CHECK ((("userId" IS NOT NULL)::int + ("keyHash" IS NOT NULL)::int) = 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chatbot_threads" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "mode" "ChatbotMode" NOT NULL,
    "lang" VARCHAR(2) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "status" "ChatbotThreadStatus" NOT NULL DEFAULT 'OPEN',
    "topicSlug" VARCHAR(64),
    "prospectId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chatbot_messages" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" "ChatbotRole" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "topicSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" VARCHAR(16),
    "model" VARCHAR(64),
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "cacheWriteTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "firstTokenMs" INTEGER,
    "stopReason" VARCHAR(24),
    "fallbackReason" VARCHAR(32),
    "partial" BOOLEAN NOT NULL DEFAULT false,
    "feedback" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chatbot_notes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "threadId" TEXT,
    "text" VARCHAR(140) NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_profiles_keyHash_key" ON "chatbot_profiles"("keyHash");

CREATE INDEX IF NOT EXISTS "chatbot_profiles_schoolId_lastSeenAt_idx" ON "chatbot_profiles"("schoolId", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "chatbot_profiles_lastSeenAt_idx" ON "chatbot_profiles"("lastSeenAt");

CREATE UNIQUE INDEX IF NOT EXISTS "chatbot_profiles_userId_schoolId_key" ON "chatbot_profiles"("userId", "schoolId");

CREATE INDEX IF NOT EXISTS "chatbot_threads_profileId_mode_lastMessageAt_idx" ON "chatbot_threads"("profileId", "mode", "lastMessageAt" DESC);

CREATE INDEX IF NOT EXISTS "chatbot_threads_schoolId_lastMessageAt_idx" ON "chatbot_threads"("schoolId", "lastMessageAt");

CREATE INDEX IF NOT EXISTS "chatbot_messages_threadId_createdAt_idx" ON "chatbot_messages"("threadId", "createdAt");

CREATE INDEX IF NOT EXISTS "chatbot_messages_schoolId_createdAt_idx" ON "chatbot_messages"("schoolId", "createdAt");

CREATE INDEX IF NOT EXISTS "chatbot_notes_profileId_createdAt_idx" ON "chatbot_notes"("profileId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "chatbot_profiles" ADD CONSTRAINT "chatbot_profiles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_profiles" ADD CONSTRAINT "chatbot_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_threads" ADD CONSTRAINT "chatbot_threads_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "chatbot_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_threads" ADD CONSTRAINT "chatbot_threads_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chatbot_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_notes" ADD CONSTRAINT "chatbot_notes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "chatbot_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "chatbot_notes" ADD CONSTRAINT "chatbot_notes_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chatbot_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
