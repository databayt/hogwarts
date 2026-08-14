# Conference

Video conferencing for schools — one self-contained block mirrored 1:1 to the `/conference` route.
Three meeting back-ends behind a single UI:

- **External pasted-link** — live everywhere, zero infra (the default every school gets).
- **LiveKit SFU** — in-app rooms + recording, fully coded but **dormant** until infra is provisioned
  (see `RUNBOOK.md`, gated by `isLiveKitConfigured()`).
- **Native Meet / Zoom / Teams** — `createMeeting` wired through each vendor API, but **dark** until
  OAuth credentials land (gated by each adapter's `isConfigured()`).

> Full reference: [content/docs-en/conference.mdx](../../../../content/docs-en/conference.mdx) ·
> Arabic: [content/docs-ar/conference.mdx](../../../../content/docs-ar/conference.mdx). Those docs'
> **Structure** section renders `<ConferenceStructure />` from
> `src/components/docs/conference-structure.tsx` — when you add/rename files below, update that
> component's node tree (not a code fence). The legacy `/docs/live-classes` pages were deleted.

## File Structure (flat block)

```
conference/
├── content.tsx · queries.ts · actions.ts · list-actions.ts   server entry + reads + barrels
├── form-steps.tsx                                             the 5 wizard steps (Basics/Schedule/Meeting/References/Access)
│                                                              Basics opens with the timetable-slot picker — the physical class
├── online-policy.ts                                           "does this school teach online, over which back-end" (single resolver)
├── day-window.ts                                              school-calendar day math (pure: window · weekday · slot instants)
├── actions/                                                   rich sessions-layer server actions
│   ├── helpers.ts        requireContext · canAccessSession · conferenceRevalidatePath
│   ├── slot-session.ts   day-qualified slot lookup + the cron's direct writer
│   ├── materialize-day.ts  turns online-school POLICY into one day's sessions
│   ├── sessions.ts       lifecycle state machine (create/start/end/cancel/list/get + fromTimetable)
│   ├── join-core.ts      shared eligibility + token mint (plain module — action AND refresh route)
│   ├── tokens.ts         joinLiveClass (initial SSR join → 5-min JWT; refresh = GET route)
│   ├── recordings.ts     list / signed-URL / delete
│   ├── notifications.ts  5 live_class_* events → notification hub (in-app + email, not a server action)
│   ├── attendance-sync.ts presence → Attendance (opt-in, LiveKit-only; not a server action)
│   ├── settings.ts       school capacity knobs + recording opt-out + attendance-sync toggle
│   ├── moderation.ts     kickParticipant (DB status="removed" first, then SFU evict)
│   └── recurring.ts      carry-forward ConferenceLink across terms + listConferenceTerms
├── authorization.ts · permissions.ts · validation.ts         rich sessions layer (strict gate)
├── list-permissions.ts · list-validation.ts · list-params.ts list layer (CRUD gate)
├── table.tsx · columns.tsx · form.tsx · schedule-form.tsx    DataTable + the two create forms
├── detail.tsx · room.tsx · participants-panel.tsx            session detail · in-app room · kick UI
├── recordings.tsx · recording-player.tsx                     recordings list · signed-URL player
├── settings-form.tsx · section-recording-policy.tsx          admin policy + per-section opt-out
├── section-online-policy.tsx                                 per-section online override (inherit / online / in person)
├── network-test.tsx · network-protocol.ts                    LiveKit diagnostic + ICE-path classifier
├── loading-skeleton.tsx
├── types.ts · error-map.ts                                   domain types · error-code → string
├── livekit/   client · token · rooms · egress · recording-urls · room-naming · webhook
├── providers/ types · external(live) · google-meet/zoom/teams(dark) · token-cache · index · README.md
└── CLAUDE.md · README.md · ISSUE.md · RUNBOOK.md
```

Tests live under `src/tests/` (URL-mirror reorg), **not** in a `__tests__/` folder here.
The Prisma models are in `prisma/models/conference.prisma`.

## Routes

| Path                          | Layout           | Roles                                              |
| ----------------------------- | ---------------- | -------------------------------------------------- |
| `/conference`                 | school-dashboard | all 7 school roles                                 |
| `/conference/[id]`            | school-dashboard | all 7 school roles                                 |
| `/conference/[id]/recordings` | school-dashboard | all except ACCOUNTANT                              |
| `/conference/schedule`        | school-dashboard | DEVELOPER · ADMIN · TEACHER                        |
| `/conference/settings`        | school-dashboard | DEVELOPER · ADMIN                                  |
| `/conference/network-test`    | school-dashboard | DEVELOPER · ADMIN (env-gated)                      |
| `/conference/[id]/room`       | **(live-room)**  | session participants (bare full-screen layout)     |
| `/live-classes/*`             | —                | legacy redirect → `/conference` (pre-rename links) |

## API

| Path                               | Method | Purpose                                                                                                       |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `/api/webhooks/livekit`            | POST   | LiveKit event ingestion (HMAC, idempotent)                                                                    |
| `/api/conference/token`            | GET    | In-room ~4-min token refresh (route handler, NOT an action — bell rule)                                       |
| `/api/cron/live-class-reminders`   | GET    | Materializes today's online-school slots, then dispatches 5–20-min start reminders (every 15 min, idempotent) |
| `/api/cron/end-stale-live-classes` | GET    | Close sessions stuck `live` past end + attendance sync; cancel never-started `scheduled` rows (every 30 min)  |
| `/api/cron/expire-live-recordings` | GET    | Per-school retention purge (daily, cap 500)                                                                   |

## Status

| Capability                                            | Status                                      |
| ----------------------------------------------------- | ------------------------------------------- |
| Prisma models (`Conference*` + link + resources)      | ✅ schema; visibility/resources DDL staged  |
| External pasted-link provider                         | ✅ live                                     |
| LiveKit-first dashboard create (5-step wizard)        | ✅ coded (in-app option gated on env)       |
| Timetable-anchored create (online school)             | ✅ live (slot → teacher/subject/section+id) |
| **School-wide "teach online" + per-section override** | ✅ coded (policy on School/Section)         |
| **Per-day session materialization from timetable**    | ✅ coded (in the `*/15` reminders cron)     |
| Grade-scoped subject + catalog-lesson pickers         | ✅ live                                     |
| Private/public control (`visibility`)                 | ✅ coded (section default / school-wide)    |
| Lesson + exam/quiz/assignment/link references         | ✅ coded (`catalogLessonId` + resources)    |
| Provider-aware Join (table/detail/room redirect)      | ✅ coded                                    |
| List CRUD + detail + schedule + settings UI           | ✅ live                                     |
| Per-section recording opt-out                         | ✅ live                                     |
| In-room HOST moderation (kick)                        | ✅ live                                     |
| Timetable Start / Join (teacher+student+guardian)     | ✅ live (`Conference.timetableId`)          |
| Timetable weekly-grid live indicators (all roles)     | ✅ coded                                    |
| Notifications → hub (in-app + email)                  | ✅ live (+ school-wide fan-out)             |
| Attendance-from-presence (opt-in)                     | ✅ live (DB applied); VIRTUAL visible in UI |
| Native Meet/Zoom/Teams `createMeeting`                | 🟡 wired, dark until OAuth creds            |
| LiveKit SFU rooms + Egress recording                  | 🟡 coded, dormant until infra               |
| Capacity dashboard (`/observability/conference`)      | ✅ live (DEVELOPER-only)                    |

Online-school pass 2026-08-14: a school (or individual sections) can be marked
as taught online and every timetable slot becomes a live class automatically —
policy stored on `School`/`Section`, sessions materialized one school day at a
time by the reminders cron, provider degrading to external until the SFU is
provisioned. See `ISSUE.md` for what it deliberately leaves open (in-room
strings, no-show attendance policy).

Production-readiness pass 2026-08-12: school-timezone schedule storage, GET
token-refresh route, list-layer status-transition guard, attendance-sync
provider guard, recording delete/egress race closed, perPage clamp. The
visibility/resources DDL is **verified applied in prod**; the only remaining
gates for the LiveKit path are the six infra gates in `RUNBOOK.md` (no
`LIVEKIT_*` env vars exist in the prod Vercel project yet).

See `ISSUE.md` for the open backlog and `RUNBOOK.md` for the 6-gate LiveKit provisioning sequence.

## Testing

```bash
pnpm vitest run src/tests --dir conference   # or target the conference specs directly
```
