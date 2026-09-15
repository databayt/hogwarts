---
epic: 12
sprint: Q3-2026
title: Offline
file_type: issue
owner: Abdout
maturity: Production-Ready
completion: 90
docs: https://ed.databayt.org/en/docs/offline
last_audited: 2026-09-13
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
- [x] Web Push lane — `PushSubscription`, VAPID, processor on the push cron, preferences toggle (2026-09-12; device delivery verified after deploy)
- [x] Install card — `install-card.tsx` in the dashboard layout: `beforeinstallprompt` on Android, Share hint on iOS, 14-day dismissal (2026-09-12)
- [x] Dashboard explorable offline — worker v7 keeps opened pages per session key, warms the sidebar from the installed app, offline/stale strip (2026-09-13)
- [x] Fast on thin networks — proxy no longer forces a 1.1 MB page re-render per Server Action; chunks served from Cloudflare's edge; 1 MB of clone CSS off the dashboard; every sidebar route prefetchable (2026-09-13)
- [x] Offline clicks land on a real page — `useOffline` off (it froze clicks before the worker), RSC payloads keyed with `_rsc`, each opened page saved as HTML once a day, "not on this device yet" card with Back and Retry, offline shell in its own untrimmed cache refreshed daily (2026-09-14)
- [x] Shared device on a slow network — sign-out button and sign-in/join pages tell the worker to forget every saved page before they move on (2026-09-14)
- [x] ~~Connection toast follows the student (#414, 2026-09-14)~~ — reversed: offline work is silent (#416, 2026-09-15)
- [ ] Static cache trims oldest-inserted first, so the most-used chunks go first once it passes 400 entries; a saved page whose chunks were trimmed shows without its scripts offline
- [ ] Exam submission in the outbox
- [ ] Transport boarding in the outbox

## Log

- 2026-09-15 — #416 (team, STUDENT on an iPhone, reverses #414): "I don't want to see any of these toasts… work silently in the background." `sync-banner.tsx` no longer shows the offline/slow strip, its Retry, the "waiting to sync" strip, or any connection toast. What stays: outbox drain triggers, the worker's `sw-stale` store, and one strip for items the server rejected (they need a person). New: on the offline→online edge a page served from a saved copy calls `router.refresh()` — only on that edge, since refreshing whenever a copy is shown would loop every four seconds on a slow link. Verified at 390px in Playwright: network cut and restored, zero toasts, no connection strip. Left as-is (per-action state, not connection notices): quick attendance's "saved on this phone" toast and the submission card's "saved on this device" line. The `offlineNow`/`slowConnection`/`backOnline`/`staleCopy`/`offlineBrowsing` dictionary keys are unused now.

- 2026-09-14 — #414 ("no notice when the internet is low or offline", STUDENT on an iPhone): the strip only renders at the top of the content, so a drop while scrolled said nothing. `sync-banner.tsx` now also fires one sonner toast with id `connection` on each change: offline (no timeout), slow (5 s), back online (3 s). Verified in Playwright at 390px with the network cut while scrolled down. Slow on iOS: Safari has no `navigator.connection`, so "slow" there still comes only from the worker serving a saved copy after four seconds; Chrome/Android also reads `effectiveType` 2g/slow-2g.

- 2026-09-14 — Protected media vs. the saved-pages cache, checked against `public/service-worker.js`: `/api/*`, cross-origin and `Range` requests return before any cache is opened, so a saved lesson page carries only `/api/lumos/video/<id>` references — offline, the text opens and the video cannot play, as policy requires. `/api/lumos/video` now also refuses non-media fetch destinations (lumos `87d62ee9e`). Docs gained "Lessons open offline; their videos do not" and "The installed app cannot block screenshots" (hogwarts#411). Not re-run on a built worker this pass — the SW itself is unchanged.

- 2026-09-14 — Offline pass verified on a local `next build` + `next start` with the server stopped. With `useOffline` on, a sidebar click sent no request and nothing moved; off, the same click reached the worker. A payload saved on students → teachers was being replayed on dashboard → teachers (URL said teachers, content stayed the dashboard): the flight key now keeps `_rsc`. Offline clicks rarely match an online `_rsc` (prefetched routes send a partial tree), so opened pages are also saved as HTML: dashboard → students offline rendered the saved page in 283 ms with the strip; an unopened page shows the not-saved card, and Back returns to the saved page. Sign-out from the user menu emptied the admin's namespace; the teacher's sign-in got a new key; the forget message cleared 4 pages + 2 payloads offline in 2 ms. Slow path, behind a proxy holding every response 5 s: a saved dashboard came back at 4.0 s with the worker's `reason: slow` and the slow-connection strip with Retry; the sign-out click emptied the teacher's pages before the logout request returned, and the admin's first dashboard load then waited 5.1 s for the network and showed the admin's page.

- 2026-09-13 — Measured on kingfahd (Chrome, 4G): dashboard HTML 1.38 MB (935 KB of it the dictionary), 63 chunks / 2.9 MB JS, 1 MB CSS, 36 prefetch requests and two 1.1 MB Server Action responses on every open; no `cf-cache-status` on any chunk. Root causes and fixes in README "Explorable offline". Deploy pending — say "deploy".

- 2026-09-12 — Verified live on demo + kingfahd before the fix: five icons 500, manifest English/single-tenant, precache of `/` and `/offline` (307s), navigations and `/api` cached without a user key. All four fixed; kun `pwa-audit` 0 FAIL against the dev server.
