---
epic: 06
sprint: Q3-2026
title: Notifications
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

# Notifications — Production Readiness Tracker

**Status:** BUILT
**Completion:** 85%
**Last Updated:** 2026-05-25

---

## MVP Checklist

- [x] Multi-channel notification center UI (in-app, email)
- [x] User notification preferences form (per-type and per-channel toggle)
- [x] Quiet hours filter and local timezone comparison
- [x] Email delivery integration via Resend
- [x] WhatsApp delivery integration via Evolution API (`whatsapp-bridge` & `dispatch.ts`)
- [x] System-wide notification dispatch helper (`dispatchNotification` and `dispatchTemplated`)
- [x] Expiration-based auto-cleanup query
- [x] Role-based permissions matrix tests (256 unit tests passing)
- [ ] Push notifications provider implementation (channel is reserved but not wired)
- [ ] SMS notifications provider implementation (channel is reserved but not wired)

## Known Issues

### P0 — Critical

- None.

### P1 — High

- Real-time bell icon polling runs on a fallback interval when Socket.IO server is disconnected (requires deployment of socket-server #262). Note for #262: the hook now always runs an initial fetch regardless of transport — a live socket only pushes NEW events, so without that fetch a freshly-connected bell would sit empty until the first event. Don't remove it when wiring the socket server.

### P2 — Medium

- User preferred language defaults to school language; per-user translation override is scheduled for a future phase.

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-08-11 — Production bell was DEAD for ~3 weeks (silent regression) +
  polling engine optimized.**

  **Regression:** `4dacd0288` (2026-07-19) added a short-circuit to
  `socket-service.ts` so production (no `NEXT_PUBLIC_SOCKET_URL` in Vercel
  env) stops hammering `localhost:3001` — but that made `connect()` RESOLVE
  without a socket. `useNotifications` treated resolution as connected
  (`setIsConnected(true)`), which disabled the 30 s polling fallback: no
  socket + no polling = bell frozen at 0/empty for every production user.
  Dev never reproduced it (localhost attempts a real connection, fails,
  rejects → polling proceeds), which is why the 07-20 browser verification
  passed while prod was already dark. Fixed: connected-state now comes from
  `socketService.isConnected()` after the promise settles, never from
  resolution; the concurrent-connect waiter in socket-service also settles
  (it used to spin a 100 ms interval forever when the attempt failed).

  **Optimization (the same pass):**
  1. **Polls moved off server actions onto `GET /api/notifications/bell`** —
     `auth()` rotates the session cookie inside action requests
     (`x-action-revalidated: 1`), so every action-based poll shipped a full
     RSC re-render of the current page (~1 MB observed in dev) instead of
     data. The route returns ~2 KB of JSON: two indexed queries + one batched
     `localize`. The action was demoted to a `server-only` module (one less
     public POST endpoint); the route wraps it.
  2. **Visibility-aware polling** — hidden tabs skip the round-trip
     entirely; on `visibilitychange` → visible the bell catches up
     immediately when the last poll is stale (> interval/2). School dashboards
     live in background tabs all day; this eliminates most poll load.
  3. **Shared in-flight dedupe** (module scope, keyed by locale, 5 s window,
     nulls never cached) — header bell + mobile bell + notification center
     collapse into ONE request instead of parallel identical polls.
  4. **Session-identity churn fixed** — effects now depend on
     `session.user.id/schoolId/role` primitives; `useSession()` returns a
     fresh object on every window-focus refetch, which was tearing down and
     re-creating the socket connection and poll timers on every focus.
  5. **Initial fetch always runs** regardless of transport (see the #262
     note above) — merged via new pure `poll-merge.ts` (forward-only
     read-state sync: server `read: true` clears a stale unread from another
     tab, but never downgrades a local optimistic read; `unreadCount` always
     follows the server).
  6. Latent fixes: `getDisplayLocale` now `await`s `headers()` (Next 16 made
     it async; the sync call silently forced the "ar" fallback and used an
     `as any`), socket `notification:new` rows get `lang` from
     `detectScript()` instead of `(data as any).lang ?? "ar"`, and
     `markAsRead` rollback now reverts the item's read flag, not just the
     count.

  Tests: 287/287 (6 new in `poll-merge.test.ts`), tsc clean.
  Browser-verified on demo.localhost: one `GET /api/notifications/bell` on
  load (dedupe collapsed both mount-time polls), Arabic bell content, badge 2. **Prod confirmation must happen post-deploy via /watch — the dev
  environment cannot exercise the prod short-circuit path** (localhost
  hostname + `.env` socket URL both bypass it).

- **2026-07-20 — "Notifications I don't understand" (user report) fixed at
  data + dispatch + card level.**
  1. **Legacy English demo rows purged + seed self-heals** — the pre-i18n
     seed had stored English titles/bodies ("Assignment Graded", …) with
     `lang: "ar"`; mislabeled rows can never be localized (translator no-ops
     when contentLang === displayLang), so Arabic viewers saw raw English.
     `seedNotifications` now deletes rows matching `LEGACY_EN_TITLES` before
     its guard (guard loosened to `> 50` so a purged table refills without
     duplicating organic rows). Ran locally: 550 purged, 550 Arabic created.
     Prod demo self-heals on next deploy (prebuild `ensure-demo` → seedMain).
  2. **`dispatchNotification` / `dispatchNotificationsToAudience` no longer
     blind-stamp `lang: "ar"`** — when the caller omits `lang`, the stored
     language is now `detectScript(title + body)`, so a future English-text
     dispatch stays translatable instead of permanently mislabeled.
  3. **Card comprehension** (card.tsx): localized type-label kicker
     (`dictionary.types[type]`) shown when it differs from the stored title —
     the category is always readable in the viewer's language; urgent/high
     priority badge (`dictionary.priorities.badge`); actor no longer falls
     back to a raw email address; Arabic long-date format (`d MMMM yyyy`);
     click-through rebases stored absolute action URLs onto the current
     locale for client-side navigation (verified: alert → `/ar/admission/
applications/<id>`).
     Tests: 281/281 notifications (2 new lang-detection cases), 210/210
     messaging. Browser-verified EN-free bell + center + messages on /ar.

- **2026-06-14 — Exam automation notifications wired.**
  Three new notification paths now call `dispatchNotification` /
  `dispatchNotificationsToAudience` from `@/lib/dispatch-notification`:
  1. **Results published** — `finalizeExamResults` (exams/mark/actions/finalize.ts)
     dispatches an `exam_results_published` notification to the class audience
     after writing all `ExamResult` + `Result` rows.
  2. **Report card ready** — `publishReportCards` (grades/actions/report-cards.ts)
     dispatches a `report_card_ready` notification to the class audience on publish.
  3. **Exam reminders** — `/api/cron/exam-reminders` sweeps upcoming exams and
     sends advance reminders to students and teachers. Runs on the existing
     Vercel cron schedule. Guards against firing after `examDate` has passed.
     All three are fire-and-forget (`.catch` logged, never thrown).

- **2026-06-12 — Scheduled broadcasts never fired.** `sendBroadcast`
  (school/communication) only processed inline when unscheduled; a batch with
  `scheduledFor` stayed `pending` forever because no cron swept it. Added
  `processDueNotificationBatches()` (email-service.ts) +
  `/api/cron/process-broadcast-batches` (every 5 min in vercel.json): sweeps
  due scheduled batches AND unscheduled batches stuck `pending` past a
  10-minute grace (crashed inline processing), with an atomic
  pending→processing claim so overlapping runs can't double-send. 5 new tests
  (`batch-sweep.test.ts`).
- **2026-06-12 — `poll-actions.test.ts` import rot fixed** (was importing the
  deleted `@/lib/content-display` shim; now mocks the batched `localize`).

## Enhancements (Post-MVP)

_Deferred to next quarter+._
