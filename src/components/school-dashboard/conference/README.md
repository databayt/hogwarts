# Live Classes

LiveKit video conferencing for scheduled and ad-hoc live classes.

**Status**: Phase 1 — feature code complete, awaiting SFU provisioning
and `LIVEKIT_*` env config before E2E test.

## Routes

| Path                          | Layout           | Roles                                                     |
| ----------------------------- | ---------------- | --------------------------------------------------------- |
| `/conference`                 | school-dashboard | DEV, ADMIN, TEACHER, STUDENT, GUARDIAN, STAFF, ACCOUNTANT |
| `/conference/[id]`            | school-dashboard | same                                                      |
| `/conference/[id]/recordings` | school-dashboard | DEV, ADMIN, TEACHER, STUDENT, GUARDIAN, STAFF             |
| `/conference/schedule`        | school-dashboard | DEV, ADMIN, TEACHER                                       |
| `/conference/network-test`    | school-dashboard | DEV, ADMIN                                                |
| `/conference/[id]/room`       | **(live-room)**  | session participants                                      |

## API

| Path                               | Method | Purpose                              |
| ---------------------------------- | ------ | ------------------------------------ |
| `/api/webhooks/livekit`            | POST   | LiveKit event ingestion (HMAC)       |
| `/api/cron/live-class-reminders`   | GET    | 10-min start reminders (every 5 min) |
| `/api/cron/expire-live-recordings` | GET    | Per-school retention purge (daily)   |

## File Structure

```
src/components/school-dashboard/conference/
├── CLAUDE.md                  — block context + danger zones
├── README.md                  — this file
├── ISSUE.md                   — open backlog
├── authorization.ts           — PERMISSION_MATRIX (10 actions)
├── permissions.ts             — FeaturePermissionsModule (tabs + UI gating)
├── validation.ts              — Zod schemas + i18n factories
├── types.ts                   — UI types + RoomJoinTicket
├── content.tsx                — overview list
├── empty-state.tsx
├── loading-skeleton.tsx
├── error-map.ts               — code → translated string
├── actions.ts                 — barrel
├── actions/
│   ├── helpers.ts             — requireContext + conferenceRevalidatePath
│   ├── sessions.ts            — create / cancel / start / end / list / get
│   ├── tokens.ts              — joinLiveClass / refreshLiveClassToken
│   ├── notifications.ts       — lang-aware dispatch (internal helper)
│   └── recordings.ts          — list / signed URL / delete
├── detail/detail-content.tsx
├── schedule/schedule-form.tsx
├── room/room-client.tsx       — LiveKitRoom + VideoConference
├── recordings/
│   ├── recordings-content.tsx
│   └── recording-player.tsx
├── network-test/network-test-client.tsx
└── __tests__/
    ├── authorization.test.ts  (26)
    ├── validation.test.ts     (11)
    ├── sessions.test.ts       (26)  — server actions + state machine
    ├── eligibility.test.ts    (17)  — joinLiveClass role resolution
    ├── recordings.test.ts     (7)   — list / signed URL / delete
    ├── multi-tenant.test.ts   (5)   — cross-tenant isolation
    ├── permissions.test.ts    (13)  — FeaturePermissionsModule
    └── error-map.test.ts      (17)  — server code → translated string
```

Lib (shared, lives outside the block):

```
livekit/
├── client.ts                  — RoomServiceClient + EgressClient singletons
├── token.ts                   — issueAccessToken (role → grants)
├── rooms.ts                   — ensureRoom / endRoom / kick
├── egress.ts                  — startCompositeEgress / stopEgress
├── recording-urls.ts          — signed S3 playback URL + delete
├── webhook.ts                 — verify + handle SFU events
├── room-naming.ts             — sch-{schoolId}-lc-{sessionId}
└── __tests__/
    ├── room-naming.test.ts    (8)
    ├── token.test.ts          (9)   — JWT grant shape per role
    └── webhook.test.ts        (12)  — dispatch + idempotency + tenant
```

Playwright E2E (`tests/e2e/conference/`):

```
feature-pages-load.spec.ts     — 5 smoke tests per browser project
rbac.spec.ts                   — 11 RBAC matrix tests per browser
                                 (103 total rows × 5 projects)
```

## Status Matrix

| Capability                             | Status                                        |
| -------------------------------------- | --------------------------------------------- |
| Prisma models + migration              | ✅ live                                       |
| LiveKit lib wrappers                   | ✅                                            |
| Server actions (create/start/end/join) | ✅                                            |
| Overview + detail + schedule UI        | ✅                                            |
| Full-screen room UI (LiveKit prebuilt) | ✅                                            |
| Recordings list + signed playback      | ✅                                            |
| Webhook handler (room + egress events) | ✅                                            |
| Reminder + retention crons             | ✅                                            |
| RBAC (`/conference/*`)                 | ✅                                            |
| Sidebar + dictionaries (en+ar)         | ✅                                            |
| Notification type sync (5 sync points) | ✅                                            |
| Network test page                      | ✅ (env-gated)                                |
| Unit tests (Vitest)                    | ✅ 151/151                                    |
| E2E tests (Playwright)                 | ✅ 103 specs ready (CLI run needs dev server) |
| SFU provisioning (G42 + coturn)        | ⏸️ infra                                      |
| AWS S3 me-central-1 bucket + IAM       | ⏸️ infra                                      |
| Webhook URL registration in LiveKit    | ⏸️ infra                                      |
| Aldar Meeting-3 network test           | ⏸️ pre-signature gate                         |
| Timetable "Start live class" button    | ⏸️ Phase 3                                    |
| Settings UI for retention / max-dur    | ⏸️ Phase 4                                    |

## Integration Points

- **Notifications**: 5 new `NotificationType` values
  (`live_class_scheduled`, `live_class_starting_soon`,
  `live_class_started`, `live_class_cancelled`,
  `live_class_recording_ready`). All five sync points wired (see
  `CLAUDE.md > Danger Zones`).
- **Timetable**: `Conference.timetableId?` is the join key for
  Phase 3 "Start live class" buttons on the timetable slot detail page.
- **Section / Subject / Teacher**: optional back-relations on each.
- **School**: 4 new columns —
  `conferenceRetentionDays` (default 90),
  `conferenceMaxConcurrent` (default 50),
  `conferenceMaxDuration` (default 120),
  `conferenceRecordingDefault` (default true).

## Testing

```bash
pnpm vitest run src/components/school-dashboard/conference
```
