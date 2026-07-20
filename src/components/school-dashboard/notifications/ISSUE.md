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
