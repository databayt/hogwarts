-- Payment idempotency + per-tenant journal numbering constraints
--
-- Scope:
--   P0-4 — Add a unique index on Payment(schoolId, transactionId) so a replayed
--          gateway webhook cannot create a second Payment for the same charge.
--          NULL transactionIds (manual cash/cheque) are distinct in Postgres,
--          so existing manual payments are unaffected.
--   P1   — Replace the GLOBAL unique on JournalEntry.entryNumber with a
--          per-school composite. entryNumber is generated per-school
--          (JE-{year}-{seq}); the global constraint collided across tenants
--          once ledger posting actually wrote (the accountCode→code fix made
--          posting functional again).
--
-- DEPLOYMENT NOTE (Hogwarts Neon):
--   Migration history is EMPTY in this repo — DO NOT run `prisma migrate deploy`.
--   These statements were applied via Neon MCP run_sql, verified first on
--   branch br-bitter-frog-adbm5ihn (0 cross-tenant entryNumber dupes / 0 dupe
--   (schoolId, transactionId)), then on default branch br-small-tooth-adscsfmb
--   (project square-hall-52214783) on 2026-06-02.
--   This file is kept for record + reference for fresh-database setups.

-- P0-4 — Payment idempotency (additive, NULL-safe).
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_schoolId_transactionId_key"
  ON "Payment" ("schoolId", "transactionId");

-- P1 — Per-school journal numbering (drop global, add composite).
DROP INDEX IF EXISTS "JournalEntry_entryNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_schoolId_entryNumber_key"
  ON "JournalEntry" ("schoolId", "entryNumber");
