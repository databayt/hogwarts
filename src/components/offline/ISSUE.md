---
epic: 12
sprint: Q3-2026
title: Offline
file_type: issue
owner: Abdout
maturity: Production-Ready
completion: 70
docs: https://ed.databayt.org/en/docs/offline
last_audited: 2026-09-12
---

# Offline -- Production Readiness Tracker

**Status:** the shell and the outbox are live; installability repaired 2026-09-12.

## Checklist

- [x] Outbox (IndexedDB) with per-item verdicts — lessons (2026-08-29)
- [x] Download-for-offline withdrawn by school policy (2026-08-30)
- [x] Service worker installs (v2, 2026-08-30)
- [x] Offline fallback actually works — v3 precaches locale-explicit pages, not 307s (2026-09-12)
- [x] Worker no longer caches authenticated HTML or API bodies (2026-09-12)
- [x] Per-tenant Arabic-first manifest, real icons, theme-color, apple-touch-icon (2026-09-12)
- [x] Quick attendance queues offline and replays idempotently (2026-09-12)
- [ ] Web Push lane (subscriptions, VAPID, processor on the push cron)
- [ ] Install card (`beforeinstallprompt`, iOS hint)
- [ ] Exam submission in the outbox
- [ ] Transport boarding in the outbox

## Log

- 2026-09-12 — Verified live on demo + kingfahd before the fix: five icons 500, manifest English/single-tenant, precache of `/` and `/offline` (307s), navigations and `/api` cached without a user key. All four fixed; kun `pwa-audit` 0 FAIL against the dev server.
