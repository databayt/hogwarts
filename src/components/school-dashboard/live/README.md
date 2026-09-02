# Conference

Video conferencing for schools — one self-contained block mirrored 1:1 to the `/live` route.
Three meeting back-ends behind a single UI:

- **External pasted-link** — live everywhere, zero infra (the default every school gets).
- **LiveKit SFU** — in-app rooms, gated by `isLiveKitConfigured()`. Four env vars away from live;
  `RUNBOOK.md` has the LiveKit Cloud quick path and the Aldar self-host sequence. Recording is a
  SEPARATE gate (`isRecordingConfigured()`) — rooms no longer wait on an S3 bucket.
- **Native Meet / Zoom / Teams** — `createMeeting` wired through each vendor API, but **dark** until
  OAuth credentials land (gated by each adapter's `isConfigured()`).

> Full reference: [content/docs-en/live.mdx](../../../../content/docs-en/live.mdx) ·
> Arabic: [content/docs-ar/live.mdx](../../../../content/docs-ar/live.mdx). Those docs'
> **Structure** section renders `<ConferenceStructure />` from
> `src/components/docs/live-structure.tsx` — when you add/rename files below, update that
> component's node tree (not a code fence). The legacy `/docs/live-classes` pages were deleted.

## File Structure (flat block)

```
conference/
├── content.tsx · queries.ts · actions.ts · list-actions.ts   server entry + reads + barrels
├── form-steps.tsx                                             the 5 wizard steps (Basics/Schedule/Meeting/References/Access)
│                                                              Basics opens with the timetable-slot picker — the physical class
├── online-policy.ts                                           "is this online, over which back-end, delivered how" (single resolver)
├── day-window.ts                                              school-calendar day math (pure: window · weekday · slot instants · day↔instant)
├── school-calendar.ts                                         "is the school running today" — ScheduleException holiday gate (write side only)
├── actions/                                                   rich sessions-layer server actions
│   ├── helpers.ts        requireContext · canAccessSession · liveRevalidatePath
│   ├── slot-session.ts   day-qualified slot lookup + the cron's direct writer
│   ├── materialize-day.ts  turns online-school POLICY into one day's sessions (both modes)
│   ├── open-room.ts      the LOOSE mode — one standing room per section per school day
│   ├── sessions.ts       lifecycle state machine (create/start/end/cancel/list/get + fromTimetable)
│   ├── join-core.ts      shared eligibility + token mint (plain module — action AND refresh route)
│   ├── tokens.ts         joinLiveClass (initial SSR join → 5-min JWT; refresh = GET route)
│   ├── recordings.ts     list / signed-URL / delete
│   ├── notifications.ts  5 live_class_* events → notification hub (in-app + email, not a server action)
│   ├── attendance-sync.ts presence → Attendance (opt-in, LiveKit-only; not a server action)
│   ├── settings.ts       capacity knobs · recording opt-out · attendance sync · the online
│   │                     window + delivery mode + standing link + link-coverage report
│   ├── moderation.ts     kickParticipant (DB status="removed" first, then SFU evict)
│   └── recurring.ts      carry-forward ConferenceLink across terms + listLiveTerms
├── authorization.ts · validation.ts                          rich sessions layer (strict gate)
├── list-permissions.ts · list-validation.ts · list-params.ts list layer (CRUD gate)
├── nav.tsx                                                    heading + tab strip for the (app) surfaces
├── landing/                                                   the /live landing page
│   ├── content.tsx           composes the sections below
│   ├── status-hero.tsx       the green (#00bc6d) banner: the headline and the two
│   │                     ways in, beside a transparent line mark
│   ├── now-strip.tsx         live / coming-up — thmanyah.com's editorial row (mirrored
│   │                     geometry), section-scoped, school-TZ times, catalog art.
│   │                     ONE lead card, then two brief ones
│   ├── session-row.tsx       the reference's article row — ONE component, drawn by
│   │                     the strip and the shelf alike, at three weights
│   │                     (lead · brief · small) and adapting to the role
│   ├── past-shelf.tsx        classes already taught — thmanyah.com's shelf block
│   │                     (mirrored geometry): a list column beside subject tiles
│   ├── readiness-band.tsx    can this school teach online (ADMIN/DEVELOPER only)
│   ├── role-guide.tsx        what THIS role can do here — real links, not marketing
│   ├── get-started-band.tsx  the pitch + 3 setup steps, only while not yet online
│   ├── reveal.tsx            the page's one motion wrapper
│   └── viewer.ts             role → what the page offers, and what a card names
│   └── types.ts              shared section props + LandingSession
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
The Prisma models are in `prisma/models/live.prisma`.

## Routes

| Path                    | Layout                   | Roles                                          |
| ----------------------- | ------------------------ | ---------------------------------------------- |
| `/live`                 | school-dashboard         | all 7 school roles — **landing page**          |
| `/live/dashboard`       | school-dashboard `(app)` | all 7 school roles — **the sessions table**    |
| `/live/schedule`        | school-dashboard `(app)` | DEVELOPER · ADMIN · TEACHER                    |
| `/live/settings`        | school-dashboard `(app)` | DEVELOPER · ADMIN                              |
| `/live/network-test`    | school-dashboard `(app)` | DEVELOPER · ADMIN (env-gated)                  |
| `/live/[id]`            | school-dashboard         | all 7 school roles                             |
| `/live/[id]/recordings` | school-dashboard         | all except ACCOUNTANT                          |
| `/live/[id]/room`       | **(live-room)**          | session participants (bare full-screen layout) |
| `/live-classes/*`       | —                        | legacy redirect → `/live` (pre-rename links)   |

`(app)` is a route GROUP: it contributes no URL segment, it only supplies the
heading + tab strip (`nav.tsx`). `/live` and `/live/[id]` sit
outside it — the landing page owns its own hero, and a session detail is a leaf
reached from a row, not a tab.

## API

| Path                               | Method | Purpose                                                                                                       |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `/api/webhooks/livekit`            | POST   | LiveKit event ingestion (HMAC, idempotent)                                                                    |
| `/api/conference/token`            | GET    | In-room ~4-min token refresh (route handler, NOT an action — bell rule)                                       |
| `/api/cron/live-class-reminders`   | GET    | Materializes today's online-school slots, then dispatches 5–20-min start reminders (every 15 min, idempotent) |
| `/api/cron/end-stale-live-classes` | GET    | Close sessions stuck `live` past end + attendance sync; cancel never-started `scheduled` rows (every 30 min)  |
| `/api/cron/expire-live-recordings` | GET    | Per-school retention purge (daily, cap 500)                                                                   |
| `/api/mobile/live/[id]/join`       | GET    | Mobile join ticket — same `join-core` eligibility as the web, JWT actor instead of a session cookie           |

## Status

| Capability                                             | Status                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Prisma models (`Conference*` + link + resources)       | ✅ schema; visibility/resources DDL staged           |
| External pasted-link provider                          | ✅ live                                              |
| LiveKit-first dashboard create (5-step wizard)         | ✅ coded (in-app option gated on env)                |
| Timetable-anchored create (online school)              | ✅ live (slot → teacher/subject/section+id)          |
| **School-wide "teach online" + per-section override**  | ✅ coded (policy on School/Section)                  |
| **Temporary "go online" window (war / weather)**       | ✅ coded (dated, open-ended, auto-reverts)           |
| **Delivery mode: timetable-bound · loose · both**      | ✅ coded (`ConferenceOnlineMode`)                    |
| **Standing fallback link + link-coverage panel**       | ✅ coded (makes an overnight flip joinable)          |
| **Holiday gate — sweep suppresses, timetable informs** | ✅ coded (one `ScheduleException` predicate)         |
| **"Online" marker on the timetable today cards**       | ✅ coded (3 role views; open rooms exempt)           |
| **Per-day session materialization from timetable**     | ✅ coded (in the `*/15` reminders cron)              |
| Grade-scoped subject + catalog-lesson pickers          | ✅ live                                              |
| Private/public control (`visibility`)                  | ✅ coded (section default / school-wide)             |
| Lesson + exam/quiz/assignment/link references          | ✅ coded (`catalogLessonId` + resources)             |
| Provider-aware Join (table/detail/room redirect)       | ✅ coded                                             |
| List CRUD + detail + schedule + settings UI            | ✅ live                                              |
| Per-section recording opt-out                          | ✅ live                                              |
| In-room HOST moderation (kick)                         | ✅ live                                              |
| Timetable Start / Join (teacher+student+guardian)      | ✅ live (`Conference.timetableId`)                   |
| Timetable weekly-grid live indicators (all roles)      | ✅ coded                                             |
| Notifications → hub (in-app + email)                   | ✅ live (+ school-wide fan-out)                      |
| Attendance-from-presence (opt-in)                      | ✅ live (DB applied); VIRTUAL visible in UI          |
| Native Meet/Zoom/Teams `createMeeting`                 | 🟡 wired, dark until OAuth creds                     |
| LiveKit SFU rooms                                      | ✅ coded; 4 env vars from live (RUNBOOK)             |
| Egress recording                                       | 🟡 separate gate — needs a bucket + creds            |
| Cron bridge (materialization + reminders)              | ✅ GitHub Actions (Vercel crons are off)             |
| Join on every Today row (student/teacher/guardian)     | ✅ live                                              |
| Parent-portal "Today" strip with Join                  | ✅ live                                              |
| Mobile: `live_class` on timetable + join endpoint      | ✅ live                                              |
| Attendance: minimum-presence floor                     | ✅ live (5 min)                                      |
| Demo seed (`db:seed:single conference`)                | ✅ repairs + policy + history + next day             |
| Substitute hosts the online arm (CONFIRMED)            | ✅ materializer + today-cards                        |
| Open-room host fallback (no homeroom teacher)          | ✅ busiest teacher on the section                    |
| Physical room on the session detail                    | ✅ via the timetable anchor                          |
| Lumos lesson → its live session today                  | ✅ `lesson-live-strip.tsx`                           |
| Student/teacher dashboard home: section-aware + Join   | ✅ (was empty for every section student)             |
| Recording surfaces honest without a bucket             | ✅ forms · settings · detail                         |
| Room UI composed from SDK primitives, en+ar, RTL-safe  | ✅ live (`room/*`; prebuilt bar retired)             |
| Adaptive delivery ladder (720/360/180 → audio+slides)  | ✅ live (`room/adaptive-delivery.ts`)                |
| Reconnecting overlay · disconnect reasons · Rejoin     | ✅ live                                              |
| Hands · questions · polls · whiteboard · slides        | ✅ live (data topic `lc` + attributes)               |
| Closed polls + questions persisted (`ConferenceEvent`) | ✅ live (`actions/room-events.ts`)                   |
| Presence survives reconnects (accumulated spans)       | ✅ live (webhook + attendance-sync)                  |
| Egress failure honest (`failed` + reason)              | ✅ live (`egress_updated`)                           |
| Recording → lesson video (lumos) bridge                | ✅ live (`actions/publish-recording.ts`)             |
| Session states on the detail page (en+ar)              | ✅ live (`session-state.tsx`)                        |
| Videos + materials view-only (no download, watermark)  | ✅ policy 2026-08-30 — see lumos records             |
| School delivery mode: in person / online / hybrid      | ✅ `School.conferenceDeliveryMode` (policy-first)    |
| Settings in the school configuration hub               | ✅ `/school/configuration/live-classes` (same panel) |
| Attendance thresholds per school (late/present/early)  | ✅ settings → `attendance-sync.ts`                   |
| Consent notice · auto-publish · guardians · join-muted | ✅ settings + ticket `roomConfig`                    |
| Room tools per school (share enforced in the token)    | ✅ settings → bar/panel + `canPublishSources`        |
| Reminder lead time per school                          | ✅ settings → reminders cron                         |
| Per-grade online override (section ?? grade ?? school) | ✅ `AcademicGrade.conferenceOnline`                  |
| Offline: student work queued + synced (no content)     | ✅ live — `src/lib/offline/*`                        |
| Capacity dashboard (`/observability/live`)             | ✅ live (DEVELOPER-only)                             |

Any-time-online pass 2026-08-14 (second): a school can now go online **at any
time, for any length, and either way round**, without ever closing the
building. Online delivery is ADDITIVE to the physical class, so the policy is a
union of three independent sources rather than a precedence contest:

```
online = sectionOverride ?? (schoolDefault || windowActive)
```

- **`schoolDefault`** — `School.conferenceOnlineDefault`, the standing "we are
  an online school" switch.
- **`sectionOverride`** — `Section.conferenceOnline`, tri-state (`null`
  inherits). Still wins in BOTH directions, including during a window: the
  window lifts the school-wide _default_, it does not override a decision
  someone made about a section.
- **`windowActive`** — `School.conferenceOnlineFrom` / `…Until` / `…Note`. The
  emergency switch: day-granular in the school's calendar, inclusive at both
  ends, and open-ended (`until = null` = "until further notice", the shape an
  emergency actually has). Clearing the start date ends it — there is no
  separate "cancel closure" verb to forget to call.

**HOW** those classes run is orthogonal, `ConferenceOnlineMode` on the school:
`timetable` (sessions bound to their period — the strict version), `open` (one
standing room per section for the whole teaching day, free timing), or `both`.

Verified end-to-end against the seeded demo school (666 slots, 24 sections, no
meeting links): offline → 154 `not_online`; window with no link → 154
`no_link`; window + standing link → **154 sessions**; re-run → 154 `exists`;
one section opted out → 7 skipped and 0 sessions for it; `open` mode → 24 rooms
spanning 07:15–14:10 school time; declared holiday → 0; expired window → back
to `not_online` with no manual step.

Online-school pass 2026-08-14 (first): the policy + per-day materialization
that the above builds on — sessions materialized one school day at a time by
the reminders cron, provider degrading to external until the SFU is
provisioned. See `ISSUE.md` for what both passes deliberately leave open
(in-room strings, no-show attendance policy).

Hybrid-school pass 2026-08-29: the block is now DEMO-ABLE and integrated. The
demo had 121 of 840 slots with a teacher — the expertise seed was count-guarded
and never caught up with the catalog — so an "online school" could put 14% of
its classes online. `prisma/seeds/live.ts` repairs that first (815/840
now), sets the LiveKit policy, and seeds five days of history with real presence

- VIRTUAL attendance, next-day sessions, a substitute host, an assembly, a
  lesson with exam/assignment/link references, recurring links and a holiday. On
  the code side: substitutes host the online arm; open rooms fall back to the
  section's busiest teacher (the real onboarding path never sets a homeroom
  teacher, so open mode was dead for every real school); the session detail shows
  the physical room; a lumos lesson shows its live session; the role home pages
  finally see section-based classes and carry Join; and every recording control
  tells the truth when there is no bucket.

Production pass 2026-08-28: the two things that actually stood between this block and a student
joining a class, neither of them the six RUNBOOK gates.

**The prod database was missing the online-school columns.** `ConferenceOnlineMode` and 7 `schools`
columns + `sections.liveClassOnline` were added to the Prisma models on 2026-08-14 with **no
migration file**, so production ran for two weeks with a client expecting columns the database did
not have — every `materializeSchoolDay` would have thrown P2022, silently, every 15 minutes.
`periods.isBreak` was missing too, which the materialization sweep filters on. Applied additively and
written up as `prisma/migrations/20260828000000_conference_online_school/`.

**Every Vercel cron is off** (`"crons": []`, free-plan bridge — see `DEPLOYMENT.md`), and
`live-class-reminders` is the only caller of `materializeOnlineSchools()`. An online school therefore
materialized nothing after the day it saved its settings. Restored via
`.github/workflows/live-crons.yml`.

Also: recording no longer gates rooms; `createLiveClass` gained the server-side provider check the
wizard only had client-side; notifications for a _started_ class link straight to the room; and
notification URLs are stored relative — they were being stored as `{subdomain}.databayt.org`, a host
that does not serve this app for any school on `balqalam.com`.

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
