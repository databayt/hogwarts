# Parent Portal — Production Readiness Tracker

**Status:** SHIPPED (post-merge verification pending)
**Completion:** 95% (deferrals listed below)
**Last Updated:** 2026-05-28
**Tracking issue:** [hogwarts#4](https://github.com/databayt/hogwarts/issues/4)
**Source-of-truth epic:** [kun docs `aldar` §04](https://kun.databayt.org/en/docs/aldar)

---

## MVP Checklist

- [x] Authentication and guardian access control
- [x] View child's grades (exam results + class scores)
- [x] View child's assignments (with submission status)
- [x] View child's timetable (weekly schedule)
- [x] View child's attendance records
- [x] View school announcements
- [x] View school events
- [x] Guardian authorization with student-guardian relationship verification
- [x] Multi-tenant isolation with schoolId scoping
- [x] **Download report cards** — async cron + signed-URL gate at `/api/parent/report-cards/[id]/download`
- [x] **Receive notifications** — `dispatchTemplated` writes `report_ready` + `grade_posted` + `attendance_alert` with locale-aware bodies via `NotificationTemplate` lookup
- [x] **Message teachers** — CTAs on landing + per-child header deep-link to `/messages` (shared UI already role-dispatches GUARDIAN to children's teachers + admin)
- [x] **View fee status** — `/{lang}/parent/fees` wraps existing `<MyFees>` (read-only)
- [x] **Update profile** — covered by the existing `/profile` route (role-dispatched)

## What's live (Aldar epic-4, all 7 phases)

| Surface                                   | Path                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Parent landing                            | `/{lang}/parent`                                                                      |
| Per-child overview                        | `/{lang}/parent/children/[id]`                                                        |
| Per-child tabs                            | `/{lang}/parent/children/[id]/{grades,report-cards,attendance,timetable,assignments}` |
| Announcements / events / messages / fees  | `/{lang}/parent/{announcements,events,messages,fees}`                                 |
| Notification preferences (WhatsApp added) | `/{lang}/settings/notifications`                                                      |
| Public transcript verification            | `/{lang}/verify/transcript/[code]`                                                    |
| Signed-URL PDF download                   | `/api/parent/report-cards/[id]/download`                                              |
| Async PDF render cron                     | `/api/cron/process-report-card-pdfs` (`*/5 * * * *`)                                  |
| Transcript PDF render cron                | `/api/cron/process-transcript-pdfs` (`*/5 * * * *`)                                   |
| Push notifications cron (scaffold)        | `/api/cron/process-push-notifications` (`*/5 * * * *`)                                |
| Term-end check cron                       | `/api/cron/term-end-report-cards` (`0 3 * * *`)                                       |

## Deferred (explicit follow-ups, not in this PR)

### P2 — Medium

- RTL Playwright pass on every `/parent/*` surface — workflow item, run the `/verify` skill against the deployed pilot subdomain
- Full dictionary-key migration in the parent-portal block (currently uses `isArabic ? "..." : "..."` ternaries — works in EN+AR, just not dictionary-compliant)
- Per-teacher pre-selection on "Message teacher" CTAs (needs a messaging-block query param)

### P3 — Lower priority

- Bulk-entry mount (`BulkGradeEntry` component exists but needs wrapper page + new `bulkCreateResults` server action)
- Composable template engine extension to report-cards / transcripts (presets picker)
- FCM SDK install + `sendPushViaFcm` body replacement — file header documents the swap
- Per-user timezone for quiet hours (today uses server-local)
- Mobile `pdf_url` removal — keep alongside `download_url` for one release cycle for older app builds
- App-store consent screens (Epic 09 owns)

---

**Test coverage:** 182/182 unit tests green across 8 Aldar-related test files. Mobile relationship guards covered by `canAccessStudent` suite (18 cases). Signed-URL endpoint covered (7 cases: 401/404/403/425/302/302-fallback).
