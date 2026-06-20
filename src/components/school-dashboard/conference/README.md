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
├── actions/                                                   rich sessions-layer server actions
│   ├── helpers.ts        requireContext · canAccessSession · conferenceRevalidatePath
│   ├── sessions.ts       lifecycle state machine (create/start/end/cancel/list/get + fromTimetable)
│   ├── tokens.ts         joinLiveClass / refreshLiveClassToken (eligibility → 5-min JWT)
│   ├── recordings.ts     list / signed-URL / delete
│   ├── notifications.ts  5 live_class_* events → notification hub (in-app + email, not a server action)
│   ├── attendance-sync.ts presence → Attendance (opt-in, LiveKit-only; not a server action)
│   ├── settings.ts       school capacity knobs + recording opt-out + attendance-sync toggle
│   ├── moderation.ts     kickParticipant (SFU evict + DB status="removed")
│   └── recurring.ts      carry-forward ConferenceLink across terms + listConferenceTerms
├── authorization.ts · permissions.ts · validation.ts         rich sessions layer (strict gate)
├── list-permissions.ts · list-validation.ts · list-params.ts list layer (CRUD gate)
├── table.tsx · columns.tsx · form.tsx · schedule-form.tsx    DataTable + the two create forms
├── detail.tsx · room.tsx · participants-panel.tsx            session detail · in-app room · kick UI
├── recordings.tsx · recording-player.tsx                     recordings list · signed-URL player
├── settings-form.tsx · section-recording-policy.tsx          admin policy + per-section opt-out
├── network-test.tsx · network-protocol.ts                    LiveKit diagnostic + ICE-path classifier
├── empty-state.tsx · loading-skeleton.tsx
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

| Path                               | Method | Purpose                                                               |
| ---------------------------------- | ------ | --------------------------------------------------------------------- |
| `/api/webhooks/livekit`            | POST   | LiveKit event ingestion (HMAC, idempotent)                            |
| `/api/cron/live-class-reminders`   | GET    | 5–10-min start reminders (runs every 5 min)                           |
| `/api/cron/end-stale-live-classes` | GET    | Close sessions stuck `live` past end + attendance sync (every 15 min) |
| `/api/cron/expire-live-recordings` | GET    | Per-school retention purge (daily, cap 500)                           |

## Status

| Capability                                        | Status                                     |
| ------------------------------------------------- | ------------------------------------------ |
| Prisma models (`Conference*` + link) + Neon       | ✅ live                                    |
| External pasted-link provider                     | ✅ live                                    |
| List CRUD + detail + schedule + settings UI       | ✅ live                                    |
| Per-section recording opt-out                     | ✅ live                                    |
| In-room HOST moderation (kick)                    | ✅ live                                    |
| Timetable Start / Join (teacher+student+guardian) | ✅ live (`Conference.timetableId`)         |
| Notifications → hub (in-app + email)              | ✅ live (all 4 mutating paths fan out)     |
| Attendance-from-presence (opt-in)                 | 🟡 coded, LiveKit-only + DB deploy-pending |
| Native Meet/Zoom/Teams `createMeeting`            | 🟡 wired, dark until OAuth creds           |
| LiveKit SFU rooms + Egress recording              | 🟡 coded, dormant until infra              |
| Capacity dashboard (`/observability/conf.`)       | ⏸️ backlog                                 |

See `ISSUE.md` for the open backlog and `RUNBOOK.md` for the 6-gate LiveKit provisioning sequence.

## Testing

```bash
pnpm vitest run src/tests --dir conference   # or target the conference specs directly
```
