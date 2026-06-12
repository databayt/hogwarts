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

- Real-time bell icon polling runs on a fallback interval when Socket.IO server is disconnected (requires deployment of socket-server #262).

### P2 — Medium

- User preferred language defaults to school language; per-user translation override is scheduled for a future phase.

## Resolved Issues

_Chronological close log — appended as items ship._

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
