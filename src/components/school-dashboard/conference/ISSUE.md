# Live-Classes — Open Issues

> Tracker: [databayt/hogwarts#3](https://github.com/databayt/hogwarts/issues/3) · Aldar Epic 03 anchor.

## P0 — Pre-signature gates (Aldar)

- [ ] **Provision G42 Cloud SFU** in UAE region. Single binary
      `livekit-server`. UDP 50000-60000, TCP 7881, TCP 443.
- [ ] **TURN-over-443-TCP** via coturn co-located with SFU. TLS cert
      from Let's Encrypt or Aldar-provisioned.
- [ ] **AWS S3 `me-central-1` bucket** + IAM role for SFU egress writes
      (`s3:PutObject` on `schools/*` prefix only).
- [ ] **Webhook URL registration** in LiveKit config →
      `https://ed.databayt.org/api/webhooks/livekit`.
- [ ] **Set env vars** in Vercel + dev: `LIVEKIT_HOST`,
      `LIVEKIT_WS_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`,
      `LIVEKIT_RECORDING_BUCKET`, `LIVEKIT_RECORDING_REGION`,
      `LIVEKIT_S3_ACCESS_KEY`, `LIVEKIT_S3_SECRET` (separate from
      app-side `AWS_*` creds).
- [ ] **Meeting-3 network test** from inside Aldar school WiFi.
      `/conference/network-test` is the surface — run as
      `admin@kingfahad.databayt.org`. **Block on TURN/443 failure.**
- [x] **Docs**: `content/docs-en/conference.mdx` written. Arabic mirror
      (`content/docs-ar/conference.mdx`) still pending.

## P1 — Phase 2 (Scheduling + reminders)

- [x] **"Start live class" button on Timetable slot detail page** — DONE.
      `StartLiveClassButton` on the teacher Current/Next card
      (`timetable/views/teacher-view.tsx`) calls the new
      `createLiveClassFromTimetable({ timetableId })` action (derives
      teacher/section/subject + period window, reuses or creates+starts the
      session) then routes to `/conference/${id}/room`. Shown only when there
      is no session/link to join yet.
- [x] **Auto-start egress** (DONE: webhook room_started → startCompositeEgress when recordingEnabled) on `room_started` if
      `Conference.recordingEnabled`. Currently the webhook
      handler upserts the recording row only after the SFU sends
      `egress_started` — but nothing in our app triggers egress, so
      Phase 1 has no automatic recording start. Either (a) call
      `startCompositeEgress()` from the webhook on `room_started`, or
      (b) configure LiveKit auto-egress on the SFU side.
- [ ] **Per-section / per-grade recording opt-out** — currently only
      a per-class boolean.

## P2 — Phase 4 (Settings + ops)

- [x] **Settings UI** (DONE: /conference/settings + updateConferenceSettings, ADMIN/DEV) for `conferenceRetentionDays`,
      `conferenceMaxDuration`, `conferenceRecordingDefault`,
      `conferenceMaxConcurrent`. Should live under
      `/settings/school` and only be writable by ADMIN/DEV.
- [ ] **Capacity dashboard** in SaaS dashboard
      (`/observability/conference`) — concurrent rooms per school,
      egress queue depth, TCP fallback rate. Wave-2 ops visibility.
- [x] **Kick participant** — DONE. `ParticipantsPanel` (HOST/CO_HOST-only
      overlay in `participants-panel.tsx`, rendered by `room.tsx` beside the
      prebuilt `<VideoConference/>`) lists remote participants via
      `useRemoteParticipants()` and calls the existing `kickParticipant`
      action with the participant identity.

## P3 — Hardening

- [x] **Multi-tenant integration test** with two demo schools — verify
      a teacher in school A cannot join, list, or playback any session
      from school B. (`__tests__/multi-tenant.test.ts`, 5 tests +
      cross-tenant case in `eligibility.test.ts`)
- [x] **Webhook integration test** with simulated LiveKit payloads —
      room lifecycle, egress lifecycle, idempotency on duplicate
      `eventId`, malformed roomName drop, cross-tenant drop, audit row.
      (`livekit/__tests__/webhook.test.ts`, 12 tests)
- [x] **State-machine test** — `scheduled → live → ended` happy path + every invalid transition (`__tests__/sessions.test.ts`,
      26 tests across create/cancel/start/end/list/get; idempotent
      start, kick-on-end, SFU-failure handling)
- [x] **Token grant test** — HOST has `roomAdmin/roomCreate/roomRecord`,
      OBSERVER is subscribe-only, TTL claim honored, metadata claims
      shape. (`livekit/__tests__/token.test.ts`, 9 tests)
- [x] **Eligibility resolution test** — HOST vs CO_HOST vs PARTICIPANT
      vs OBSERVER resolution per role + section/guardian membership.
      (`__tests__/eligibility.test.ts`, 17 tests)
- [x] **Playwright RBAC + smoke specs** — `tests/e2e/conference/`
      with `feature-pages-load.spec.ts` (5 tests) and `rbac.spec.ts`
      (11 tests) covering ADMIN/TEACHER/STUDENT/GUARDIAN/STAFF/ACCOUNTANT
      allowed-vs-blocked routes + ar RTL rendering. 103 test rows
      across browser projects.
- [ ] **3-node SFU + LB** for Wave-2 capacity (~5K concurrent →
      ~15K). Sticky room routing.
- [ ] **MinIO on-prem fallback** for recordings if Aldar procurement
      requires it. Storage abstraction already supports per-school
      `s3Bucket`/`s3Region` columns.
- [x] **Type the `Dictionary` namespace** to include `liveClasses` so
      we can drop the `as unknown as { liveClasses?: ... }` casts in
      content components. (Dropped from all 8 call sites; type already
      inferred from JSON imports.)

## Done

### Maturity pass (2026-06-06)

- [x] In-room HOST moderation UI (`participants-panel.tsx` + kick wiring).
- [x] Real ICE-path detection in `network-test.tsx` (`network-protocol.ts`
      `classifyFromStats` → direct-udp / turn-udp / turn-tcp-443).
- [x] Timetable "Start live class" button + `createLiveClassFromTimetable`.
- [x] Native provider adapters implemented (`providers/{google-meet,zoom,teams}`
      real OAuth + createMeeting) + wired into the create flow behind
      `isConfigured()` (ships dark until OAuth creds land).
- [x] `stopEgress` wired into `endLiveClass`; `carryForwardConferenceLinks`
      exposed as an admin button on `/conference/settings`.
- [x] ~40 new tests (moderation panel, start button, protocol classifier,
      stop-egress, native providers via mocked fetch, webhook route,
      expire-recordings cron, egress + recording-urls units). Whole-project tsc 0.

- [x] Prisma schema + Neon promotion (2026-05-28)
- [x] LiveKit lib (client, token, rooms, egress, recording-urls,
      webhook, room-naming)
- [x] Block scaffold (authorization, permissions, validation, types,
      content, empty-state, error-map, actions/\* split)
- [x] Routes (overview, detail, schedule, recordings, network-test +
      bare-layout room route group)
- [x] Webhook + 2 cron routes + `vercel.json` cron entries
- [x] Sidebar + dictionaries + RBAC + 5-point notification type sync
- [x] 12 `LIVE_CLASS_*` action error codes
- [x] **151 unit tests** across 11 files (authorization 26 · validation
      11 · sessions 26 · eligibility 17 · recordings 7 · multi-tenant 5
      · permissions 13 · error-map 17 · room-naming 8 · token 9 ·
      webhook 12) + **103 Playwright test rows** across 2 specs ×
      5 browser projects.
- [x] Block docs (CLAUDE.md, README.md, this ISSUE.md)
- [x] Tenant-leak fix in `getLiveClass` fallback
- [x] s3Bucket / s3Region populated on egress_started (was empty
      string, blocked playback)
- [x] notifyClassStarted + notifyClassRecordingReady wired into
      webhook handler
