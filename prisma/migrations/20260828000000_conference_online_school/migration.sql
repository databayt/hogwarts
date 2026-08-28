-- Conference — online-school policy columns (migration-of-record)
--
-- NOTE: This project's DB history is empty; schema changes are applied additively
-- via Neon/psql, NOT `prisma migrate deploy`. This file documents what was applied
-- to the production default branch (br-small-tooth-adscsfmb) on 2026-08-28.
--
-- These columns were added to prisma/models/{school,classrooms,conference}.prisma
-- on 2026-08-14 (40441df21, f9bbf7eac) with NO migration file, so production ran
-- for two weeks with a Prisma client expecting columns the database did not have.
-- Verified missing on 2026-08-28 via information_schema and closed by this file.
--
-- Safety: every statement is additive and idempotent. Each new column is either
-- nullable or carries a default, so no existing row is rewritten and no read is
-- invalidated. Rollback point: Neon branch `pre-conference-ddl-2026-08-28`
-- (br-patient-poetry-adppmsfa).

-- Delivery mode: a session per timetable slot, one standing room per section, or both.
DO $$ BEGIN
  CREATE TYPE "LiveClassOnlineMode" AS ENUM ('timetable', 'open', 'both');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Period.isBreak — the source of truth the materialization sweep filters on
-- (`period: { isBreak: false }` in actions/materialize-day.ts, queries.ts,
-- actions/settings.ts). Without it every materializeSchoolDay call P2022s, which
-- would have made the online-school feature fail silently every 15 minutes.
-- NOTE: existing rows default to false. Break periods must be re-flagged from the
-- school's schedule structure — a school whose فسحة is not flagged will have a
-- live session materialized into its break.
ALTER TABLE "periods" ADD COLUMN IF NOT EXISTS "isBreak" BOOLEAN NOT NULL DEFAULT false;

-- School-level online policy: the standing switch, the temporary window
-- (from/until/note — day-granular, open-ended), the delivery mode, the provider
-- preference, and the standing fallback link that makes an overnight flip joinable.
ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "liveClassFallbackUrl"     TEXT,
  ADD COLUMN IF NOT EXISTS "liveClassOnlineDefault"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "liveClassOnlineFrom"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "liveClassOnlineMode"      "LiveClassOnlineMode" NOT NULL DEFAULT 'timetable',
  ADD COLUMN IF NOT EXISTS "liveClassOnlineNote"      TEXT,
  ADD COLUMN IF NOT EXISTS "liveClassOnlineUntil"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "liveClassProviderDefault" "LiveClassProvider" NOT NULL DEFAULT 'external';

-- Per-section override of the school default. Tri-state: NULL inherits.
ALTER TABLE "sections" ADD COLUMN IF NOT EXISTS "liveClassOnline" BOOLEAN;
