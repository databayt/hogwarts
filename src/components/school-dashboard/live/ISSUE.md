# Conference — Open Issues

> Tracker: [databayt/hogwarts#3](https://github.com/databayt/hogwarts/issues/3) · Aldar Epic 03 anchor.
> Block renamed `live-classes/` → `conference/` (models `LiveClass*` → `Conference*`, DB preserved
> via `@@map`). Code symbols + dictionary keys still use `liveClass` / `live_class_*`.

## Landing: past-classes shelf + the banner ground 2026-09-02 — closed

- [x] **A second shelf, in the reference's shelf geometry.**
      `landing/past-shelf.tsx` — icon + 24px heading, a "more" link opposite,
      then a list column (two ended classes) beside a grid of six subject
      tiles. Backed by `getLiveLandingPast`, section-scoped through the same
      `resolveViewerSectionScope` the strip uses, and folded into the page's
      ONE batched `localize` / `getNames` / `getLabels` pass rather than a
      second one.
- [x] **The banner takes the reference's ground.** `#000d04` with an angular
      green field on the inline-end side, white ink, white pill. The headline
      is now `تجربة تفاعلية تجعل التعليم أقرب وأكثر تأثيراً`, with the opening
      phrase carrying the weight.

- [ ] **Two tiles can render the same picture.** The tile grid dedupes by
      SUBJECT id, which is correct, but several demo catalog subjects share one
      `thumbnailKey` — so the grid shows what looks like a duplicate. Deduping
      by artwork instead would drop a real subject from the shelf, so the fix
      is upstream (distinct catalog art), not in the component.

- [ ] **The demo's `upcoming` slice has been empty for days.** Every
      `scheduled` row on the demo school sits on 2026-08-30, so the strip's
      two-up small rows have still never rendered in a browser. Re-run
      `pnpm db:seed:single conference` before trusting any change to that half
      of `now-strip.tsx`.

## Landing hero 2026-09-01 — closed

- [x] **The hero is a hero, not a second status board.** Green `#00bc6d` banner
      (the saas-marketing hero's triad: green ground · black ink · `#9fe5b1`
      mark), headline + one supporting sentence about what live classes are,
      and the way in. The live-now count, the delivery-mode line and the
      "Join now" button are gone from it — the strip below already names the
      subject, section and time of the class that is running.

- [ ] **Six landing strings have no reader.** The card rows carry no button any
      more (the row itself is the link, as in the reference), so
      `landing.now.joinNow` / `now.open` and `landing.actions.join` /
      `start` / `observe` / `openNext` are unused. Harmless, but they will read
      as live copy to the next person translating this file.

- [ ] **`getLiveLandingCounts` has no caller.** The hero was its only reader.
      The query and `src/tests/school-dashboard/live/landing-counts.test.ts`
      are still in the tree; delete both, or give the counts a surface that
      wants them (the dashboard header is the obvious candidate).

## PRE-deploy — prod DDL ✅ APPLIED 2026-08-28

> This was real, and worse than recorded: production had been running for two
> weeks against a Prisma client expecting columns the database did not have.
> Verified missing via `information_schema` on 2026-08-28, not assumed.

- [x] Applied additively to the prod default branch (`br-small-tooth-adscsfmb`)
      behind the Neon safety branch `pre-conference-ddl-2026-08-28`
      (`br-patient-poetry-adppmsfa`). Written up as
      `prisma/migrations/20260828000000_conference_online_school/migration.sql`:
      `CREATE TYPE "LiveClassOnlineMode"`; `schools.liveClassOnlineFrom` /
      `…Until` / `…Note` / `…Mode` / `liveClassFallbackUrl` /
      `liveClassOnlineDefault` / `liveClassProviderDefault`;
      `sections.liveClassOnline`.
- [x] **`periods.isBreak` was missing too** — not previously tracked here. The
      materialization sweep filters `period: { isBreak: false }` in four places,
      so every `materializeSchoolDay` would have thrown P2022. Added with
      `DEFAULT false`.
- [x] `prisma migrate diff` against prod now reports **no** conference drift.
      (It still reports drift in other blocks — finance, admission, twenty,
      lumos instructor policies, `schools.trialEndsAt`. Deliberately NOT touched:
      out of scope for this pass, and the diff contains non-additive statements
      — `roomName SET NOT NULL`, `PricingRule.updatedAt DROP DEFAULT` — that
      must not be applied blind. Do **not** run `prisma db push` to close it.)

- [ ] **Follow-up: re-flag break periods.** `isBreak` defaulted every existing
      row to `false`, so a school whose فسحة predates the column now reads as
      teaching time and can have a live session materialized into the break.
      Re-derive from each school's schedule structure.

## Hybrid-school pass 2026-08-29 — closed

- [x] **Demo seed** — `prisma/seeds/live.ts` + `db:seed:single conference` + a phase in `seedMain` after Timetable. Repairs first (isBreak, expertise
      top-up, teacher backfill 121 → 815/840), then policy, five days of history
      with presence + VIRTUAL attendance, next-day sessions, substitute host,
      assembly, lesson + exam/assignment/link, recurring links, a holiday.
      Verified on a Neon branch: byte-identical on re-run.
- [x] **Substitute teachers hosted nothing** — now resolved into the HOST
      (materializer) and the today-cards (both role paths). Weekly grid left as
      the pattern, deliberately.
- [x] **`open` mode dead for every real school** — `autoProvisionSections` never
      sets `homeroomTeacherId`; the room now falls back to the section's busiest
      teacher.
- [x] **Role home pages blind to section-based slots** — both queries OR'd the
      section arm; the student card carries Online + Join.
- [x] **Physical room invisible on the session** — detail reads it through the
      timetable anchor.
- [x] **Lumos → conference back-link** — `lesson-live-strip.tsx` on the lesson page.
- [x] **Recording promised with no bucket** — every surface gated on
      `isRecordingConfigured()`.

## Deferred, with reasons (2026-08-29)

- [ ] **Online exams.** `SchoolExam` has no delivery-mode concept and the exam
      block has zero awareness of conferences; `ProctorMode` is anti-cheat
      strictness, not location. Modelling "this exam is proctored live" is an
      exam-block feature. The one-way `ConferenceResource.schoolExamId`
      reference is seeded and shown.
- [ ] **No UI writes `Section.homeroomTeacherId`.** The open-room fallback
      covers the runtime; a section-settings control is the real fix.
- [ ] **Per-section delivery mode**, **nullable `classroomId`**, **weekly-grid
      closure signal** — unchanged from the 08-14 list; none blocks a hybrid
      school.
- [ ] **Seed blemish: the lesson session's ASSIGNMENT is not subject-matched.**
      `seedShowcase` picks "any PUBLISHED assignment" (the exam pick IS matched
      on `subjectId`), so a Grade-10 literature session carries a Grade-11
      chemistry presentation. Prefer `class: { subjectId }` on the assignment
      pick. Prod is count-guarded, so this only changes on a `SEED_FORCE` run.
- [ ] **25 demo slots still have no qualified free teacher** after backfill —
      every candidate is at the 25/week cap in that (day, period). Raise the cap
      or add teachers; not a code problem.

## Found during the 2026-08-29 production join test

Verified live on `demo.balqalam.com`: teacher + student in one LiveKit room, full
webhook lifecycle (`room_started` → 2× `participant_joined` → 2× `participant_left`
→ `room_finished` → `ended`), `leftAt`/`durationSeconds` written. One real gap,
and one I reported wrongly:

- [x] **No End control on the session detail page** — FIXED 2026-08-29.
      `endLiveClass` had existed since the block was built with zero UI callers, so
      a teacher could start a class and join it but never finish it; the test
      session only closed when LiveKit's empty-room timeout fired `room_finished`.
      That is minutes of an empty room, and for a school with attendance sync on,
      minutes before the register is written. `end-class-button.tsx` now renders on
      `detail.tsx` while `status === "live"`, gated to DEVELOPER/ADMIN/TEACHER and —
      for a TEACHER — to their OWN class, mirroring `endLiveClass`'s own ownership
      check rather than offering a button the server will refuse. `getLiveClass`
      now selects `teacher.userId` so that check is possible. Two clicks: ending
      is not undoable and disconnects everyone still in the room.

- [ ] ~~`/live/settings` has no provider control~~ — **NOT A GAP. I was wrong.**
      The control exists (`settings-form.tsx`, `conferenceProviderDefault`), is
      fully wired through `liveClassSettingsSchema` and `updateLiveSettings`,
      and even carries the "SFU not provisioned yet" hint. It is gated behind
      `anyOnline = conferenceOnlineDefault || windowActive`, which is deliberate:
      the provider only decides how ONLINE classes are delivered, so it is
      meaningless for a school that is neither online by default nor inside a
      window. The demo school is neither, which is why it was not on screen. An
      admin who wants LiveKit turns "Teach online" on and the control appears in
      the same form, saved in the same submit. Nothing to fix — recorded so the
      next reader does not re-open it.

Not a defect, but recorded so the next person doesn't chase it: the timetable Join
button could NOT be exercised on the demo school — its slots are on dow 0/1/2/4 and
the test ran on a Saturday, `student@balqalam.com`'s section has zero slots, and
`teacher@balqalam.com`'s slots carry no section or subject. Demo-data shape, not code.

## Closed 2026-08-28 — production pass

- [x] Recording no longer gates rooms — `isLiveKitConfigured()` (4 vars) vs
      `isRecordingConfigured()` (bucket). Was the single code defect standing
      between the block and a working room.
- [x] Cron bridge: `.github/workflows/live-crons.yml`. Every Vercel cron
      has been off since 2026-08-27 and `live-class-reminders` is the only
      caller of `materializeOnlineSchools()`, so an online school materialized
      nothing after the day it saved its settings.
- [x] `createLiveClass` gained the server-side `isLiveKitConfigured()` check
      (was client-gated only — listed as P3 hygiene, promoted and fixed).
- [x] Join renders on EVERY row of the Today list in all three role views, not
      only the Current/Next card (`isRowLiveJoinable`).
- [x] Parent portal shows a "Today" strip with Join — guardians previously had
      no discoverable path to a child's live class at all.
- [x] Mobile can join: `live_class` on `/api/mobile/timetable/[userId]` +
      `GET /api/mobile/live/[id]/join` (shares `join-core`, JWT actor).
      Conference notifications now request the `push` channel too.
- [x] `started` notifications deep-link to `/room`; notification URLs are stored
      relative (they were `{subdomain}.databayt.org` — a host that serves a
      different app for every `balqalam.com` school).
- [x] Attendance presence floor (`MIN_PRESENCE_MINUTES = 5`) — a 5-second join
      scored the same as sitting the whole lesson.
- [x] **Decided: a no-show online class does NOT mark its roster absent.** Keeps
      current behaviour; see conference/CLAUDE.md for the reasoning.

## Post-deploy verification (next deploy)

- [ ] `GET /api/conference/token?sessionId=…` resolves tenant context on a
      tenant host (same class as the bell route — BOTH GET routes are local,
      neither has run in prod yet; verify alongside the bell check).

## Review findings — 2026-08-13 (read-only pass, nothing fixed)

> Baseline at the time of the review: `tsc` 0, **267/267** conference-area
> tests green (23 files). Every item below was traced in the code, not
> inferred from these records. Ranked; the P0 infra gates and the P3 hygiene
> list further down are unchanged and not repeated here.
>
> **The three P1s were fixed the same day** — see _P1 review fixes (2026-08-13)_
> under Done for what changed and why. The P2/P3 items below remain open.

### P1 — the list layer accepts an end BEFORE the start — FIXED

- [x] `list-validation.ts` (create `.refine` ~line 152, update `.refine` ~line 233) compares **dates only** (`endDate >= startDate`) and never compares
      the combined instants — `startTime` / `endTime` are validated against
      `TIME_REGEX` alone. The wizard's step 2 exposes both as free inputs
      (`form-steps.tsx:254-262`), so `10:00 → 08:00` on one day is accepted and
      stores `scheduledEnd < scheduledStart`. The rich sessions layer gets this
      right (`validation.ts:64` and `:109`) — this is drift between the two
      deliberately-separate layers, on the layer that is actually live.
      Knock-on effects, both real: - the per-school duration cap is bypassed (`list-actions.ts:513`
      computes a **negative** `durationMin`, which is never `> cap`); - `end-stale-live-classes` treats the row as stranded on its very first
      pass (`scheduledEnd < now − 30m` is already true), so the cron ends a
      class that is genuinely live and fires `syncLiveAttendance`
      against a partial presence set — the roster is marked from whoever
      happened to have joined.

### P1 — `updateLiveClass` never re-checks `conferenceMaxDuration` — FIXED

- [x] Create enforces the cap in both paths (`list-actions.ts:513`,
      `actions/sessions.ts:107`). The update path recomputes **both** instants
      (`list-actions.ts:865-883`) and applies them with no duration check and no
      end-after-start check. Create a 60-minute in-app room, edit it to 23
      hours. The cap on `/live/settings` is effectively advisory once a
      row exists.

### P1 — 10 fire-and-forget promises on a serverless runtime — FIXED

- [x] `void notifyClass*` / `void syncLiveAttendance` at
      `list-actions.ts:717,926,928,963` · `actions/sessions.ts:165,293` ·
      `livekit/webhook.ts:118,168,307` ·
      `src/app/api/cron/end-stale-live-classes/route.ts:54`. On Vercel the
      function may be frozen once the response is returned, so unawaited work
      is not guaranteed to run. `list-actions.ts:7` and `actions/sessions.ts:6`
      **already import `after` from `next/server`** and use it correctly for
      `prewarm` (`:660`, `:904`, `:167`) — the same treatment was never applied
      to the notification and attendance calls.
      Sharpest instance: attendance-from-presence has **no** reliable execution
      path — the primary trigger (`webhook.ts:168`) and the backstop cron
      (`route.ts:54`) are both bare `void`.
      ("Best-effort" is the right policy; `after()` is how it is spelled.)

### P2 — the slot picker silently truncates at 500 — FIXED

- [x] `queries.ts:373` caps `getLiveSlotOptions` at `take: 500`, ordered
      by `dayOfWeek` then period start. A 6-day × 8-period × 15-section school
      is 720 slots (the seeded Albayan term is 840), so the **end of the week
      disappears** and those classes simply cannot be scheduled online — with no
      "showing 500 of N" signal anywhere. Also ships the whole 500-row joined
      payload to the client on wizard open, in a `Select` with no search.

### P2 — the token-refresh loop rests on an incorrect model of the SDK — FIXED

- [x] Verified in `node_modules`: `Room.connect` early-returns when the room is
      already connected (`livekit-client.esm.mjs:29563`), and the SFU pushes
      refreshed tokens over the signal channel (`SignalClient.onTokenRefresh`).
      So the token polled by `room.tsx:70-110` **never reaches the connected
      `Room`**, and reconnects were already covered by the SDK. The comment at
      `room.tsx:32-37` ("the fresh token only matters for RECONNECTS") states
      the opposite of what this SDK does. Two consequences: - the poll's only real function is a **client-cooperative** eligibility
      heartbeat — mid-class enrollment revocation holds only if the browser
      keeps calling. (Deliberate removal is a different, genuinely
      server-enforced path: `kickParticipant` evicts on the SFU and
      `status: "removed"` blocks rejoin — that one is fine.) - `room.tsx:99-103` tears down a **working** call after 3 failed
      heartbeats (~60s of API trouble), which contradicts the file's own
      stated rationale now that the token is known to be inert for the
      established session.

### P2 — wizard load failure is indistinguishable from "no data" — FIXED

- [x] `form.tsx:154-164` — when `getLiveSlots()` returns
      `success: false` the picker just renders empty. A teacher reads that as
      "this school has no timetable". Same class as the tracked
      `content.tsx` / `recordings.tsx` item below, but on the primary create
      path.

### P3 — the in-room UI is the one surface the dictionary never reaches — PARTLY FIXED

- [x] `room.tsx:137` renders LiveKit's prebuilt `<VideoConference />`: its
      controls, chat and leave affordances are English-only, and
      `data-lk-theme="default"` pins a fixed theme regardless of the app theme
      or `dir`. For an Arabic-RTL-default product this is a visible seam the
      moment the LiveKit path goes live.

### P3 — reminders cron cannot finish a large window — FIXED

- [x] `src/app/api/cron/live-class-reminders/route.ts:60-75` dispatches
      sequentially — up to 1000 sessions × (`loadSession` + hub fan-out with
      email) under `maxDuration = 60`. On timeout the processed prefix has its
      `reminder_starting_soon` rows and the tail does not; 15 minutes later the
      5–20-minute window has moved past those sessions, so **they are never
      reminded**. (`dispatch` swallows its own errors — `actions/notifications.ts:223`
      — so a single failure does not abort the run; only the wall clock does.)

### P3 — retention purge only ever sees `ready` — PARTLY FIXED

- [x] `src/app/api/cron/expire-live-recordings/route.ts:26` filters
      `status: "ready"`. Rows stranded in `pending` / `processing` (egress died
      before `egress_ended`) and `failed` rows are never swept and have no S3
      cleanup path — they accumulate indefinitely once the SFU is live.

## P3 — Hygiene (non-blocking, noted 2026-08-12)

- [ ] Route files hardcode their `ALLOWED_ROLES` arrays instead of importing
      `PERMISSION_MATRIX` from `authorization.ts` (6 files; verified in-sync
      today — duplication only bites on the next matrix edit).
- [ ] Dropdown/option queries are unbounded (`getLiveClassFormOptions`,
      `listSectionRecordingPolicy`) — realistic school sizes bound them.
- [ ] Zoom/Teams `createMeeting` carry no idempotency key (Google Meet does);
      both adapters are dark until OAuth creds land.
- [ ] `content.tsx` / `recordings.tsx` render a load failure as an empty list
      (logged server-side, invisible to the user).

## P0 — Pre-signature gates (Aldar)

> **All P0 items below are INFRA / OPS, not code** — provisioning + credentials +
> an in-school network test. The application side (SFU wrappers, readiness
> diagnostic, webhook, crons, egress) is complete and gated by
> `isLiveKitConfigured()`; it activates the moment these env vars + infra land.
> See `RUNBOOK.md` for the 6-gate sequence.

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
      `/live/network-test` is the surface — run as
      `admin@kingfahad.databayt.org`. **Block on TURN/443 failure.**
- [x] **Docs**: `content/docs-en/live.mdx` + Arabic mirror
      (`content/docs-ar/live.mdx`) both written and rendering
      (Structure-first, post-rename, providers marked wired/dark).

## P1 — Phase 2 (Scheduling + reminders)

- [x] **"Start live class" button on Timetable slot detail page** — DONE.
      `StartLiveClassButton` on the teacher Current/Next card
      (`timetable/views/teacher-view.tsx`) calls the new
      `createLiveClassFromTimetable({ timetableId })` action (derives
      teacher/section/subject + period window, reuses or creates+starts the
      session) then routes to `/live/${id}/room`. Shown only when there
      is no session/link to join yet.
- [x] **Auto-start egress** (DONE: webhook room_started → startCompositeEgress when recordingEnabled) on `room_started` if
      `Conference.recordingEnabled`. Currently the webhook
      handler upserts the recording row only after the SFU sends
      `egress_started` — but nothing in our app triggers egress, so
      Phase 1 has no automatic recording start. Either (a) call
      `startCompositeEgress()` from the webhook on `room_started`, or
      (b) configure LiveKit auto-egress on the SFU side.
- [x] **Per-section / per-grade recording opt-out** — DONE.
      `Section.conferenceRecordingOptOut` + `setSectionRecordingOptOut`
      (`actions/settings.ts`) + `section-recording-policy.tsx` UI on
      `/live/settings`. Applied at create in BOTH paths
      (`actions/sessions.ts` and `list-actions.ts` — the latter gap was closed
      in the 2026-06-13 hardening pass).

## P2 — Phase 4 (Settings + ops)

- [x] **Settings UI** (DONE: /live/settings + updateLiveSettings, ADMIN/DEV) for `conferenceRetentionDays`,
      `conferenceMaxDuration`, `conferenceRecordingDefault`,
      `conferenceMaxConcurrent`. Should live under
      `/settings/school` and only be writable by ADMIN/DEV.
- [x] **Capacity dashboard** in SaaS dashboard — DONE.
      `/observability/live` (DEVELOPER-only via the saas-dashboard
      layout) shows live rooms + live-by-school, scheduled-today, recordings
      ready + storage, and the TURN/TCP-fallback rate
      (`saas-dashboard/observability/live/{queries,content}.tsx`). The
      fallback rate is now scoped to actually-joined participants (2026-06-13).
      Egress queue depth is SFU-internal → remains "requires SFU".
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
- [x] **Playwright RBAC + smoke specs** — `tests/e2e/live/`
      with `feature-pages-load.spec.ts` (5 tests) and `rbac.spec.ts`
      (11 tests) covering ADMIN/TEACHER/STUDENT/GUARDIAN/STAFF/ACCOUNTANT
      allowed-vs-blocked routes + ar RTL rendering. 103 test rows
      across browser projects.
- [ ] **3-node SFU + LB** for Wave-2 capacity (~5K concurrent →
      ~15K). Sticky room routing. _(INFRA — not code.)_
- [ ] **MinIO on-prem fallback** for recordings if Aldar procurement
      requires it. _(INFRA — the code side is ready: storage abstraction
      already supports per-school `s3Bucket`/`s3Region`, and the S3 client is
      now cached per-region.)_
- [x] **Type the `Dictionary` namespace** to include `liveClasses` so
      we can drop the `as unknown as { liveClasses?: ... }` casts in
      content components. (Dropped from all 8 call sites; type already
      inferred from JSON imports.)

## Configuration pass — 2026-08-30

Closed:

- [x] **School delivery mode** — `School.conferenceDeliveryMode` (physical /
      online / hybrid, migration `20260830120000`, backfilled from each
      school's real behaviour: demo → hybrid, the rest → physical). The policy
      engine reads it FIRST: physical ignores section overrides and windows,
      online is every section, hybrid is the old behaviour. The settings
      action derives the legacy `conferenceOnlineDefault` and the window from
      the mode so the row never says two things.
- [x] **Live classes inside `/school/configuration`** — a `live-classes`
      section (sidebar description = current mode) mounting the same
      `LiveSettingsPanel` as `/live/settings`. Two doors, one
      panel.
- [x] **Attendance thresholds are settings** — late grace, minimum presence,
      early-leave minutes (were constants).
- [x] Switching to physical tells the admin that today's already-scheduled
      sessions stay and close on their own (the end-stale cron), instead of
      silently leaving zombies or silently cancelling.

Built the same day (migration `20260830150000_live_class_configuration_options`,
applied prod + local):

- [x] **Recording consent notice** — `School.conferenceRecordingConsentNote`
      (null = the app's sentence), shown once per join as a dismissible strip
      when the session records; **auto-publish** switch
      (`conferenceAutoPublishRecordings`) gates the recording → lesson bridge.
- [x] **Guardians may observe** — `conferenceGuardiansObserve`; join-core
      refuses a GUARDIAN when off.
- [x] **Students enter muted** — school default
      (`conferenceStudentsJoinMuted`) + per-session override
      (`Conference.studentsJoinMuted`, tri-state from the class form: school
      default / muted / open). The ticket carries the resolved value.
- [x] **Room tools** — chat, hands, polls, whiteboard, student screen share
      (`conferenceTool*`); the bar and side panel hide what is off; student
      screen share is enforced in the TOKEN (`canPublishSources`), not only
      hidden.
- [x] **Reminder lead time** — `conferenceReminderLeadMinutes` (1–60); the
      cron scans the widest lead and applies each school's own.
- [x] **Per-grade delivery** — `AcademicGrade.conferenceOnline` (tri-state);
      the engine resolves section ?? grade ?? school in hybrid mode; a grade
      list sits under the section list in settings.
- [x] **Protection row + recording storage** — read-only policy statement and
      the school's video storage used vs plan quota (`getSchoolVideoUsage`).

Known limits: chat/hands/polls/whiteboard are UI-level switches (the data
channel stays open for the tools that are on); only screen share is enforced
server-side. The consent strip is informational — there is no per-student
consent record.

## Live-class + offline pass — 2026-08-29

Closed (all browser-verified on demo.localhost with a real LiveKit Cloud room,
teacher + student contexts, 2026-08-29/30; the screenshots were session-local
and are not kept — the DOM evidence is summarised in the memory topic file):

- [x] Own control bar / side panel / stage — Arabic labels, RTL layout.
- [x] Delivery ladder with hysteresis; manual override; "تم تشغيل وضع الصوت
      والشرائح" banner at the bottom rung.
- [x] Reconnecting overlay ("جارٍ إعادة الاتصال…"); disconnect reasons →
      removed / ended / elsewhere / lost-with-Rejoin.
- [x] Raise hand (participant attribute), questions, polls with a host-only
      vote path and broadcast tally, whiteboard (host draws), slides (browser
      PDF viewer, page-synced), late-join snapshot.
- [x] Host persists closed polls + questions as `ConferenceEvent` rows.
- [x] Presence accumulates across reconnects; `participant_connection_aborted`
      closes a span; egress failure lands as `failed` + reason.
- [x] Recording → lesson video bridge (`publishRecordingAsLessonVideo`, same
      bucket CopyObject). Never downloadable (`allowDownload: false`) — school
      policy 2026-08-30: recordings are watched in the app.
- [x] Session states on the detail page: not started (countdown) · live now +
      enter · ended → recording processing / ready (→ lesson) / failed.
- [x] Students join with mic + camera off.

Deferred, with reasons:

- [ ] **A co-host's poll tallies nowhere when the teacher is absent.** Votes
      are addressed to `hostIdentity` (the teacher) only, so a room run by a
      CO_HOST alone shows no counts. Fix: address votes to every participant
      whose `role` attribute is HOST/CO_HOST.
- [ ] **Slides on iOS Safari show the first page only.** The presenter is the
      browser's own PDF viewer in an iframe with `#page=N`; WebKit ignores the
      fragment. A pdf.js viewer would fix it at the cost of shipping the
      library to every phone.
- [ ] **Three video rungs, not the 1080→240 ladder.** Simulcast carries three
      layers per publication; the ladder is 720 / 360 / 180 / audio-only.
- [ ] **`adaptiveStream` is off by design** — with it on the SDK ignores
      `setVideoQuality`/`setEnabled`. Consequence: without the ladder stepping
      down, a viewer receives the highest layer their tile can show.
- [ ] **Whiteboard strokes are room-scoped.** Nothing persists them; a host
      who leaves and returns starts with a blank board. Persist to
      `ConferenceEvent` on `wb.clear`/end if a school asks for it.
- [ ] **Egress failure is terminal.** LiveKit does not retain media from a
      failed egress; `failed` is shown honestly and cannot be retried.
- [ ] **Observers (guardians) cannot raise hands or ask questions** — no
      `canPublishData` / `canUpdateOwnMetadata` grant, on purpose.
- [ ] **Presence rows stay `invited` on local dev.** LiveKit Cloud's webhook
      points at production; local rooms never receive `participant_joined`.
      Verified on prod in the 2026-08-29 join test instead.

## Open — carried forward from the online-school pass (2026-08-14)

- [x] **In-room UI is still English-only** — CLOSED 2026-08-29. The room is
      composed from the SDK primitives (`room/*`), every string comes from
      `liveClasses.room`, and the forced `dir="ltr"` is gone. Original note:
      `dir="ltr"` pinned the LiveKit
      subtree so its layout stops being mirrored under RTL, but the strings
      themselves are hardcoded inside `@livekit/components-react` — the package
      exposes NO i18n hook (verified: `ControlBarProps` has `variation` and
      `controls`, no labels; the prefab bundle carries literal "Camera",
      "Chat", "Leave", "Microphone", "Settings"). Translating them means
      composing our own control bar + chat from the primitives instead of using
      `<VideoConference />`. Feature-sized; do it before the LiveKit path goes
      live to real Arabic-speaking students.
- [ ] **Recordings stuck `pending`/`processing` still have no sweeper.** The
      retention cron now also purges `failed`, but an egress that dies
      mid-flight leaves a row no cron will ever settle. Deliberately not
      auto-purged: deleting the object under an egress still writing it is
      worse than an orphan row. Needs an ops surface (age-out to `failed` after
      N hours, or a dashboard count) rather than a silent delete.
- [ ] **Should a no-show online class mark its roster absent?** The end-stale
      cron now closes abandoned `scheduled` sessions as `cancelled` WITHOUT
      running `syncLiveAttendance` — a cleanup cron must not decide that
      an entire section was absent. Product call, then wire it (or don't).
- [x] **`getTodaySchedule` derived its weekday from the SERVER clock** — FIXED.
      Both today-card paths (`getTodaySchedule` and `getChildTodaySchedule` in
      `timetable/actions.ts`) now resolve the weekday with `schoolDayOfWeek`
      against `School.timezone`, so they agree with the materialization sweep.
      A third `getDay()` remains at ~line 6887 — a substitution-planning loop
      over a generated date range, a different concern, left alone deliberately.

## Open — carried forward from the any-time-online pass (2026-08-14, second)

- [ ] **The transportation cron still carries its own holiday predicate.**
      `build-tomorrow-trips/route.ts:78` duplicates what `school-calendar.ts`
      now owns. Left alone on purpose this round: that cron derives `tomorrow`
      AND `weekday` in UTC throughout, so pointing only its holiday gate at
      `findSchoolClosure` would make one arm school-timezone-aware and leave
      the rest naive — and for a school west of Greenwich it would then check
      the WRONG day. Fixing it properly means moving the whole cron onto
      `schoolDayWindow`, and it has no tests to catch a regression. Do those
      together or not at all.
- [ ] **The weekly grid still shows a normal week through a holiday.** The
      today-cards now carry the closure notice, and the materialization sweep
      suppresses, but `SimpleGrid` has no closure signal — it renders a weekly
      PATTERN, so marking one day inside it needs a per-day input the grid
      does not currently take.
- [ ] **An ended open room does not reopen the same day.** The idempotency
      check runs against every DECIDED status, so a teacher who ends the
      section's standing room at 09:00 has no room for the rest of the day
      (they can create an ad-hoc session from the wizard). The conservative
      choice: auto-reopening would spawn a fresh row every 15 minutes. If loose
      mode gets real use, the right fix is an explicit "reopen" action, not a
      change to the sweep.
- [ ] **The delivery mode is school-wide only.** A school cannot run
      timetable-bound classes for its senior sections and a loose room for the
      juniors. `ConferenceOnlineMode` would move to `Section` as a tri-state,
      exactly like `conferenceOnline`.
- [ ] **The standing fallback link is one shared room.** Every (section,
      subject) without its own `ConferenceLink` falls back to the same URL, so
      two classes running at the same period land in one meeting. Acceptable as
      the emergency floor — it is the difference between joinable and nothing —
      and the settings copy says so, but a per-section fallback is the obvious
      next step, and an open room has no other source at all.
- [ ] **`SubstitutionRecord` is not resolved into the materialized host.** A
      slot whose teacher is absent with a confirmed substitute still
      materializes with the ORIGINAL teacher as HOST, so the substitute cannot
      start the class. Left alone deliberately for now, on the `rotationWeek`
      precedent: no read path in the app resolves substitutes into the grid
      either, and fixing only the sweep would break the mirror. Fix both, or
      neither.
- [ ] **`Timetable.classroomId` is REQUIRED**, so a fully-online school must
      still assign physical rooms to build a timetable at all, and the
      today-card shows that room with no hint the class is being delivered
      online. Do NOT relax the schema — the timetable engine's uniqueness
      constraints are built on it. The cheap version is a "Virtual" row in
      `ClassroomType` by convention plus an Online badge on the card; the
      honest version is a nullable `classroomId` with the engine's room
      constraints made conditional, which is a timetable-block project.

## Done

### Landing page + nested surfaces (2026-08-16)

`/live` was the sessions table with a one-tab "All" strip over it. It now
opens the way `/lumos` does, and the table moved behind a route group.

- [x] **`/live` is a landing page** (`landing/`): hero (copy + a room
      collage — a student in a real class as the speaker tile, two smaller
      tiles and the control bar around it), four value cards, a live/coming-up
      strip, a full-bleed value band, three setup steps, and a closing band.
      All copy is dictionary-driven under `school.liveClasses.landing` in BOTH
      `school-en.json` and `school-ar.json` — no `d?.key || "English"` lookups
      with no key behind them.
- [x] **The table moved to `/live/dashboard`**, inside a new `(app)`
      route group whose layout supplies the heading + tab strip (`nav.tsx`).
      `schedule` / `settings` / `network-test` moved into the same group, so
      their URLs are unchanged and they gained the strip for free (each also
      dropped its own `p-6`, which the layout now supplies).
- [x] **A real tab strip.** `list-permissions.getTabsForRole` returned a single
      "All" tab; it now returns Sessions · Schedule · Settings · Network test,
      narrowing by role (STUDENT/GUARDIAN see only Sessions, so there is no tab
      they'd be bounced out of). Covered by `src/tests/school-dashboard/live/nav-tabs.test.ts`.
- [x] **Mutations revalidate both list pages.** `liveListRevalidatePaths()`
      returns `/live` and `/live/dashboard`; the eight bare
      `liveRevalidatePath()` call sites loop it. The route group
      contributes no URL segment, so the second path has no `(app)` in it.
- [x] **The live/coming-up strip is section-scoped** through the same
      `resolveViewerSectionScope` the table uses, batch-translated in one pass
      (localize + getNames + getLabels), and its start times are formatted in
      the SCHOOL's timezone server-side. The whole read is try/caught — a query
      failure leaves the landing standing rather than taking the block down.
- [x] Assets under `public/live/`: the student hero photo, two Figma
      participant/screen-share tiles, and Google's Meet `warm_welcome` +
      `agenda_empty_state` illustrations, **served locally rather than
      hotlinked off gstatic**. Note these last two are Google's own Meet
      artwork — replace them if that matters for a customer-facing release.
- [x] Verified in the browser at `/en/live` and `/ar/live` (RTL
      mirrors correctly, all copy Arabic) plus every `(app)` surface. tsc 0 ·
      361 conference tests green.

### Timetable seams — online badge + closure notice (2026-08-14)

Two things the any-time-online pass left the timetable unable to say.

- [x] **An "Online" marker beside the physical room** on all three role views'
      Current/Next card and day list (`OnlineBadge` in
      `timetable/views/live-join-button.tsx`). Shown BESIDE the room, never
      instead of it — online delivery is additive, so the card has to say both.
      Gated on `liveClass.sessionId`, deliberately NOT on `liveClass` being
      truthy: a recurring default link means "there is a room you could use",
      which every school with a standing Zoom link has, and badging that would
      print "Online" on every card forever in a school that never went online.
- [x] **A closure notice** — `getTodaySchedule` / `getChildTodaySchedule` now
      return the HOLIDAY / CANCELLED `ScheduleException` covering the day, and
      the views render it above the cards (`ClosureNotice`).

      It **informs rather than blanks**, which reverses what this file
      prescribed a few hours earlier. The reason: `ScheduleException` rows are
      hand-entered, and blanking the hottest read path on a stale one would
      take a school's whole timetable away with no explanation. Suppressing a
      WRITE is recoverable — the next sweep re-materializes. A hidden read just
      looks broken. So the sweep and the read path share ONE predicate
      (`findSchoolClosure`) and react to it differently, on purpose.

- [x] +9 tests: badge gating (session vs bare link vs nothing), closure notice
      rendering, and the predicate's school-calendar-day window, type filter
      (EVENT / MODIFIED_SCHEDULE are still teaching days) and tie-break.

### Open-mode reachability + a future-day bug (2026-08-14)

Both found only by running the sweep and the resolver against the seeded demo
school; both invisible to the unit tests.

- [x] **Open rooms were unreachable from the timetable.** `attachLiveClasses`
      keys on (section, subject) and an open room has neither a slot nor a
      subject, so a `mode: "open"` school got no badge and no Join on ANY card
      — `/live` was its only surface, which defeats the point of the
      loose mode. A section-level lookup now resolves it, ranked LAST (a
      per-slot session and the subject's own link are both more specific). It
      resolves for EVERY period of the section's day, which is correct: the
      room is open for all of them.
- [x] **`materializeOpenRoom` would not build any future day after lunchtime.**
      The "already over" guard compared `dayEnd` against `ctx.date`, which
      callers pass carrying the current TIME-OF-DAY on the target date — so
      once the wall clock passed the last period's end, every future day looked
      over (a 15:20 run refused to build tomorrow's rooms because tomorrow's
      classes end at 12:10). Now `Date.now()`, matching
      `materializeSlotSession`'s `period_over`. The cron passes
      `ctx.date = new Date()`, so the two comparisons coincide there and
      nothing caught it — yesterday's drill passed by three minutes.
      **General shape to watch: any "is it past yet" check whose right-hand
      side is a caller-supplied DATE rather than the clock.**

### Any-time online — window · delivery mode · fallback link (2026-08-14)

The block could already make a school online PERMANENTLY. It could not make one
go online **for a while**, and its one delivery shape was "reproduce the bell
schedule". Both are now covered, without ever closing the building.

- [x] **Online is additive, so the policy is a UNION** —
      `sectionOverride ?? (schoolDefault || windowActive)`. The window sits
      inside the inherit, so an explicit per-section decision still wins in both
      directions during an emergency. The alternative (window overrides
      everything) was considered and rejected: going online takes nothing away,
      so there is nothing to override.
- [x] **`School.conferenceOnlineFrom` / `…Until` / `…Note`** — the emergency
      switch. Day-granular in the school's calendar, inclusive at both ends,
      `until = null` meaning "until further notice". Clearing `from` ends it,
      so there is no separate cancel verb. Days travel as `"YYYY-MM-DD"` and
      store at NOON school time (a `Date` parses as UTC midnight and lands a day
      early west of Greenwich; a stored midnight can be pushed across the date
      line by any later offset read).
- [x] **`ConferenceOnlineMode` — `timetable` · `open` · `both`.** `open` gives
      each section one standing room for the whole teaching day with no period
      boundaries (`actions/open-room.ts`), modelled as an ordinary slot-less
      session so nothing downstream learns a new concept. Host is the section's
      homeroom teacher; a section without one skips with `no_teacher`.
- [x] **`School.conferenceFallbackUrl` + `getLiveLinkCoverage`.** THE
      blocker on the whole promise: prod has no SFU, so an emergency school
      degrades to external, and every pair without a `ConferenceLink` was
      skipped as `no_link` into a cron log — a school that flipped online
      overnight got nothing, silently. The settings page now names the
      uncovered pairs and offers a standing link that makes them all joinable.
- [x] **Holiday gate on the sweep** (`school-calendar.ts`). The read side is
      now covered too, but DIFFERENTLY — see the next entry.
- [x] **Past periods are skipped** (`period_over`), so a mid-day flip stops
      filling the table with rows the end-stale cron immediately cancels.
- [x] **Saving settings materializes the day inline** via `after()`, instead of
      waiting up to 15 minutes for the next `*/15` tick.
- [x] **The session detail page states how attendance is handled** for that
      session (`describeAttendanceSync`) and links to the register when it is
      manual. An external meeting carries no presence — the common case for an
      emergency school — and the previous silence read as "handled" right up
      until the register was empty.
- [x] **Verified end-to-end** against the seeded demo school (666 slots, 24
      sections, zero meeting links): offline → 154 `not_online`; window with no
      link → 154 `no_link`; window + standing link → **154 sessions**; re-run →
      154 `exists`; one section opted out under an active window → 7 skipped
      and 0 sessions for it; `open` mode → 24 rooms spanning 07:15–14:10 school
      time; declared holiday → 0 with `holiday: 1`; expired window → back to
      `not_online` with no manual step.
- [x] **Tests**: +55 (policy union / window boundaries / indefinite window /
      section-beats-window / source+note / mode plumbing; day↔instant
      round-trip across UTC+14, UTC-11, DST and a :45 offset; open-room
      creation, idempotency, cancelled, no_teacher, no_link, day_over, livekit
      two-step; sweep holiday / fallback precedence / three modes; slot
      `period_over` with a pinned clock; settings window normalisation).
      Also repaired two specs that had drifted from the FIRST 08-14 pass and
      were failing before this one started (`end-stale-live-classes` gained
      `abandoned`/`cancelled` in its body, `live-class-reminders` moved from
      per-session `create` to one batched `createMany`).

### Online school — policy + per-day materialization (2026-08-14)

"A school wants to teach online" had no switch: online teaching worked one
class at a time, driven by whoever clicked. Now an admin marks the school (or
individual sections) as taught online, picks a back-end, and every timetable
slot becomes a live class — reminded, attendance-capable, and lit on the weekly
grid — with no per-session data entry. tsc 0 · **474/474** conference +
timetable + observability (37 new). The `bilingualField` hardcoded-ratchet
failure remains pre-existing school-marketing/template drift.

- **Policy, not sessions.** `School.conferenceOnlineDefault` +
  `School.conferenceProviderDefault`, overridden by the tri-state
  `Section.conferenceOnline` (`null` inherits, so a section can be held back
  from a school that went online AND go online in one that hasn't).
  `online-policy.ts` is the single resolver; it DEGRADES a `livekit`
  preference to `external` whenever `isLiveKitConfigured()` is false, so a
  school can opt into in-app rooms before the six RUNBOOK gates land and be
  promoted with no migration and no re-setup.
- **Materialized one school day at a time**, inside the existing reminders
  cron (`*/15`) so a slot created now is reminded on the same run. A term's
  worth would be ~8,600 guesses per school; a day is ~120 rows.
  `maxDuration` 60 → 300 to fit both halves.
- **Day math extracted and tested** (`day-window.ts`): `schoolDayWindow`,
  `schoolDayOfWeek`, `slotInstantsOn` — pure, and correct across DST (a
  spring-forward day is 23 hours, not 24) and on both sides of the UTC date
  line.
- **Prereq: slot idempotency was not date-qualified.**
  `createLiveClassFromTimetable` reused ANY `scheduled|live` session on the
  slot — fine for one-offs, but a weekly slot would have dropped the teacher
  into last week's row the moment sessions recurred, keying today's attendance
  to the wrong date.
- **Prereq: the timetable read path computed "today" in the SERVER zone.**
  `attachLiveClasses` and `getLiveClassIndicators` used `setHours()` — UTC on
  Vercel — so the Join button and the grid dot landed on the wrong day for any
  school whose local day straddles the boundary. The read-side twin of the bug
  the 2026-08-12 pass fixed for storage.
- **Join now matches by SLOT first.** A subject taught twice in one day
  produced two sessions under one `section:subject` key, and "earliest wins"
  resolved the afternoon card to the morning session — a Join there would write
  attendance against the wrong slot. Latent before; a daily event once every
  slot is materialized.
- **Abandoned sessions are swept.** Materialization creates rows nothing else
  closes (external sessions never even reach `live`), so the end-stale cron
  gained a second arm: `scheduled` past its end + grace → `cancelled`,
  deliberately without attendance sync (see the open question above).
- **Join matching is slot-first, and tested.** Four cases locked: two sessions
  on one (section, subject) resolve to their OWN period; an entry with no
  anchor still falls back to section+subject; an ad-hoc session with no
  `timetableId` is still found by an anchored card; and a real session always
  beats the recurring link.
- **Blended `revalidatePath` calls were dead.** A real cuid inside a bracketed
  route matches no cache tag even with `"page"` — Next registers a page under
  its route PATTERN or its concrete URL, never a mix. Four per-session call
  sites now use the literal `[id]` pattern via
  `liveSessionRevalidatePaths()`.
- Admin surface on `/live/settings` (toggle + provider select + the
  provisioning hint + a per-section override list), full en/ar dictionary
  coverage, and `DEFAULT_SCHOOL_TZ` de-duplicated into `day-window.ts`.

#### Staging manifest (2026-08-14)

The working tree carries **271 changed files** across three concurrent sessions
(a `stream` → `lumos` rename, earlier `listings/students` work, and this pass),
so a commit must be staged from an explicit list, not `git add -A`. These 43
files — and only these — are this pass:

```
content/docs-ar/live.mdx
content/docs-en/live.mdx
prisma/models/classrooms.prisma
prisma/models/school.prisma
src/app/[lang]/s/[subdomain]/(school-dashboard)/live/settings/page.tsx
src/app/api/cron/end-stale-live-classes/route.ts
src/app/api/cron/live-class-reminders/route.ts
src/components/docs/live-structure.tsx
src/components/internationalization/dictionaries/ar/live-classes.json
src/components/internationalization/dictionaries/en/live-classes.json
src/components/internationalization/school-ar.json
src/components/internationalization/school-en.json
src/components/school-dashboard/live/CLAUDE.md
src/components/school-dashboard/live/ISSUE.md
src/components/school-dashboard/live/README.md
src/components/school-dashboard/live/actions/helpers.ts
src/components/school-dashboard/live/actions/materialize-day.ts
src/components/school-dashboard/live/actions/recordings.ts
src/components/school-dashboard/live/actions/sessions.ts
src/components/school-dashboard/live/actions/settings.ts
src/components/school-dashboard/live/actions/slot-session.ts
src/components/school-dashboard/live/day-window.ts
src/components/school-dashboard/live/form-steps.tsx
src/components/school-dashboard/live/form.tsx
src/components/school-dashboard/live/list-actions.ts
src/components/school-dashboard/live/list-validation.ts
src/components/school-dashboard/live/livekit/webhook.ts
src/components/school-dashboard/live/online-policy.ts
src/components/school-dashboard/live/queries.ts
src/components/school-dashboard/live/room.tsx
src/components/school-dashboard/live/section-online-policy.tsx
src/components/school-dashboard/live/settings-form.tsx
src/components/school-dashboard/live/validation.ts
src/components/school-dashboard/timetable/actions.ts
src/components/school-dashboard/timetable/live-class-join.ts
src/tests/school-dashboard/live/day-window.test.ts
src/tests/school-dashboard/live/list-actions.test.ts
src/tests/school-dashboard/live/list-validation.test.ts
src/tests/school-dashboard/live/materialize-day.test.ts
src/tests/school-dashboard/live/online-policy.test.ts
src/tests/school-dashboard/live/queries.test.ts
src/tests/school-dashboard/live/slot-session.test.ts
src/tests/school-dashboard/timetable/live-class-join.test.ts
```

Nine of them are new (`online-policy.ts`, `day-window.ts`,
`actions/slot-session.ts`, `actions/materialize-day.ts`,
`section-online-policy.tsx`, and four test files), and the modified files import
them — staging a partial list ships a build that does not compile.

### P2/P3 review fixes (2026-08-14)

- **Slot picker no longer truncates silently** — cap raised past any realistic
  term timetable and the query fetches `CAP + 1` so the action can WARN with a
  count instead of quietly serving half a week.
- **The token poll no longer tears down a working call.** Transient failures
  now retry with backoff indefinitely; only a deny verdict ejects. The old
  3-strikes teardown contradicted the file's own rationale — and that rationale
  was itself wrong for this SDK, so the comment was corrected too.
- **The wizard says when the slot list FAILED to load** instead of rendering an
  empty picker that reads as "this school has no timetable".
- **Reminders cron batched** (concurrency 10 + one `createMany`), dispatch
  before the idempotency stamp so a crash costs a duplicate rather than a
  permanently suppressed reminder.
- **Retention purge also sweeps `failed`** recordings.
- **In-room UI pinned to `dir="ltr"`** so an English-only interface stops being
  laid out right-to-left. The strings themselves remain open (above).

### P1 review fixes (2026-08-13)

The three P1s from the review pass above, fixed. tsc 0 · conference
**276/276** (9 new). The `bilingualField` hardcoded-ratchet failure is the
same pre-existing school-marketing/template drift noted in the 08-12 pass —
every offender it lists is a file this change never touched.

- **End-before-start is now impossible on the list layer.** New
  `endsAfterStart()` in `list-validation.ts` decides ordering day-first, then
  by the zero-padded `"HH:mm"` string — deliberately WITHOUT building a
  `Date`, because both halves are combined much later in the school's
  timezone and a `new Date()` here would mix in the browser's (client) or the
  server's (server) instead. Both schemas use it; the message is a new
  `endBeforeStart` dictionary key (en + ar) anchored on `endTime`, which is
  the field the teacher actually has to change on the common same-day case.
  The old `endDateAfterStart` key stays — it is still the right message when
  only dates are in play.
- **Both guards now run server-side too, against the EFFECTIVE boundaries.**
  `createLiveClass` rejects `scheduledEnd <= scheduledStart` BEFORE the
  duration cap, because the cap divides those two instants and a negative
  duration is never `> cap` — an inverted schedule slipped both guards at
  once. `updateLiveClass` applies the same ordering check AND re-applies
  `conferenceMaxDuration` (for `provider === "livekit"`; provider is immutable
  on edit, so the stored one decides) whenever either boundary moves,
  resolving the untouched half from the stored row. The cap had been
  create-only: book a 60-minute room, then stretch it to 23 hours.
  Two existing update tests moved only the start past an untouched end — a
  genuinely inverted schedule the old code stored silently; their fixtures now
  move both boundaries and keep testing what they were written to test (the
  school-TZ recompute).
- **`void` → `after()` at all 10 dispatch sites** (`list-actions.ts` ×4,
  `actions/sessions.ts` ×2, `livekit/webhook.ts` ×3, the end-stale cron ×1).
  A dangling promise is not guaranteed to run once the response is sent. Both
  action files already imported `after` and used it for `prewarm`, so this was
  drift, not a missing idea. Sharpest case: `syncLiveAttendance` had NO
  reliable trigger at all — its primary path (webhook `room_finished`) and its
  backstop cron were both bare `void`, so opt-in attendance could silently
  never be written. "Best-effort" is preserved: `after()` runs off the response
  path and its rejection is logged, never propagated into the state transition.

### Online-school pass — wizard anchored to the timetable + catalog (2026-08-12)

"Add conference" was disconnected from the school it belongs to: three free
selects (teacher / subject / section) with nothing tying them to a real class.
The consequence was concrete, not cosmetic — **`liveClassSchema` had no
`timetableId` and `createLiveClass` never set one, so every dashboard-created
session was invisible to `syncLiveAttendance`** (which needs sectionId
AND timetableId). Only the teacher's "Start live class" button produced an
attendance-capable session. A school could hold all its classes online and
record no attendance for any of them.

- **The wizard now opens on the physical class.** Step 1 leads with a
  timetable-slot picker ("Mathematics · Grade 1-A · Sunday 08:00") sourced from
  the active term via a new `getLiveSlots` action — lazily, when the
  wizard opens, never as page props (a term's timetable is easily 1000+ rows).
  Break periods (`Period.isBreak`, never the name), unassigned slots and
  sectionless slots are excluded; a TEACHER sees only their own slots.
  Picking one fills teacher/subject/section, the period's time window, the next
  date that weekday falls on, and a default title.
- **The slot is authoritative server-side.** `timetableId` now flows through
  the schema and the action, which re-derives teacher/subject/section from the
  slot row and IGNORES the client's copies — a crafted payload can't staple
  section A's roster onto section B's period. Mirrors
  `createLiveClassFromTimetable`. Authority holds on EDIT too — `updateLiveClass`
  rejects a teacher/subject/section change on an anchored row (the edit form
  leaves those selects open otherwise, so an admin could have moved the section
  while the anchor still pointed at the old slot, and the sync would then mark
  the wrong roster against that period). The anchor itself is immutable
  (re-anchoring would re-key attendance). Two knock-on wins: those sessions
  now sync attendance, and they
  appear as live/scheduled dots on the weekly timetable grid
  (`getLiveClassIndicators` keys on `timetableId`).
- **Catalog scoped by grade.** Subject options were flattened across ALL grades
  (`distinct: ["catalogSubjectId"]`) — scheduling for Grade 1-A offered Grade
  12 subjects. Now filtered to the section's `gradeId`, labeled with the
  school's own `customName` when set. Catalog lessons are filtered by
  `Chapter.grades` against the section's `gradeNumber`, with an `isEmpty`
  branch so not-yet-grade-tagged chapters stay visible.
- **`status` dropped as a create input** — every session is born `scheduled`;
  a crafted payload could previously mint one already `live` (skipping room
  provisioning + the concurrent cap) or `ended`. Completes the transition guard
  added on update in the previous pass.
- **Removed the dead duplicate** `getLiveClassFormData` (defined in
  `list-actions.ts`, imported nowhere — the live copy is
  `queries.getLiveClassFormOptions`), so the two can't drift apart now that one
  is grade-scoped.
- `SelectField` gained an optional `onValueChange` side-effect hook (additive,
  used by the slot picker to fill the dependent fields).

tsc 0 · conference 261/261 (12 new) · i18n + timetable suites green. The
`bilingualField` hardcoded-ratchet failure is pre-existing drift in
school-marketing/template files (untouched here).

**Deliberately NOT built** (natural follow-up, needs its own decision): bulk
auto-provisioning of rooms for every timetable slot — "turn the whole school
online" in one click, with a recurrence policy.

### Production-readiness pass (2026-08-12)

Full block + LiveKit + open-issues trace ("optimize and trace any gaps until
production ready"). Ground truth first: prod DB has ALL conference DDL applied
(visibility/resources/attendance-sync/VIRTUAL — the July "deploy gate" was
stale), prod has ZERO `LIVEKIT_*` env vars (SFU dormant by design), 0 sessions
created yet. tsc 0 · **269/269** conference-area tests green (25 new/updated).

- **School-timezone schedule storage (P1, live path):** the wizard combined
  date+time via `setHours()` — the SERVER's timezone (UTC on Vercel), so
  10:00 entered in Dubai stored 10:00Z and displayed 14:00; reminder and
  live-now windows shifted with it. New precise Intl-based helpers in
  `src/lib/timezone.ts` (`schoolWallTimeToUtc` / `schoolCalendarDayOf` /
  `schoolTimeStringOf`, server-TZ-independent, DST-aware); create + update
  combine in `School.timezone`. The rich schedule-form path (client-side
  combine) was already correct.
- **Token refresh off server actions (org-wide bell rule):** the in-room
  ~4-min refresh was a server action — auth() rotates the session cookie in
  action requests, so EVERY refresh shipped a full RSC re-render (~1MB ×
  participant × 4 min; a 30-student lesson ≈ 330MB of pointless payload).
  Join logic extracted to `actions/join-core.ts` (plain module), new
  `GET /api/conference/token` (refresh-only semantics: `allowAutoStart:
false`), `room.tsx` polls it via fetch. Refresh failures now discriminate:
  deny verdicts eject immediately; transient errors retry 3× (20s apart)
  instead of tearing down a WORKING call on one blip.
- **List-layer status machine (P1):** `updateLiveClass.status` was a free
  field — could resurrect ended/cancelled rows or flip anything `live`
  (bypassing room + cap), and a fabricated live external session ending via
  the stale-cron would have attendance-marked a whole roster ABSENT. Now:
  no-change always OK; `scheduled → cancelled|ended`; `live → ended` external
  only (LiveKit must go through `endLiveClass` for room/egress teardown);
  everything else `LIVE_CLASS_INVALID_STATE`; `actualEnd` stamped on end.
  **Defense in depth:** `syncLiveAttendance` now hard-guards
  `provider === "livekit"` (its "no-op for external" comment was wrong — an
  external session has NO participant rows, so a sync = all-ABSENT).
- **Unbounded perPage (HIGH):** `?perPage=999999999` reached Prisma `take`
  unclamped from the URL (list-params has no bound; the capped schema was
  dead code). Clamped at the choke point (`buildPagination`, ≤200) + the
  schema now actually parses `getLiveClasses` params.
- **Recording delete/egress race:** deletes now allowed only for settled
  recordings (`ready|failed|expired`); webhook `egress_ended` write is
  guarded (`deletedAt: null`, status in-flight, notify only on count>0) — a
  late retry can no longer resurrect an admin-deleted row into an invisible
  "ready" orphan. `listRecordings` stops shipping S3 bucket/key/egressId to
  the client (display fields only). Playback URLs signed for a 4h session —
  the old 5-min TTL + 4-min `src` swap reset playback to 0:00 mid-watch and
  its one-shot refresh chain died permanently on first failure (error path
  was unreachable); expiry now surfaces via the video `onError` → Play again.
- **revalidatePath was a structural no-op** at all 14 call sites — bracketed
  dynamic paths are ignored without the `type` arg; all now pass `"page"`.
- **School-wide visibility in the list layer:** list `getLiveClass` denied
  assemblies to students/guardians (only the WHERE honored
  `visibility: school`); scope now also treats a member-with-no-section as
  an empty scope (assemblies still reach them) instead of "none".
- **Notification spam:** every edit re-sent "class scheduled" to the roster
  (the form always submits schedule fields) — now only an actually-moved
  boundary or a real cancel notifies.
- **Moderation ordering:** kick writes DB `removed` BEFORE the SFU evict —
  the old order could evict-then-fail and leave the row active (instant
  rejoin, moderation defeated). Failure mode now bounded by token TTL.
- Smaller: `carryForwardLiveLinks` → one `createMany({skipDuplicates})`
  (real failures no longer mislabeled "skipped"); catalog lesson links on the
  detail page scheme-locked at render (`javascript:`/`data:` from weaker
  sibling schemas render as text); legacy `/live-classes/*` redirect is now
  `permanentRedirect` (308) and preserves the query string; orphaned
  `empty-state.tsx` deleted; `endLiveClass` final write status-guarded;
  moderation lookup filters `deletedAt`; silent catches now log;
  `absence_unreported_followup` email labels added (sibling drift the block
  CLAUDE.md warns about); cron cadence doc drift fixed (reminders _/15,
  end-stale _/30) in README/docs/route comment.

### LiveKit-first production pass (2026-07-12)

Made the block LiveKit-first end-to-end, added private/public room control,
lesson/quiz/assignment references, and converted the create form into a
5-step compact wizard. tsc 0; 237/237 conference tests green (13 new),
timetable 149, attendance 507, dictionary parity green.

- **Dashboard create is provider-aware (P0 for "use LiveKit"):** the list
  layer no longer hardcodes `provider: "external"` — the wizard's Meeting
  step offers **In-app room (LiveKit)** vs **External link**. The LiveKit
  branch mirrors `actions/sessions.ts` semantics (placeholder → tenant
  roomName via `roomNameFor`, HOST participant upsert, per-school duration
  cap); external keeps the adapter flow. In-app option defaults on and is
  disabled with a provisioning hint until `isLiveKitConfigured()`.
- **Provider-aware Join everywhere:** table row menu (external → vendor URL
  new tab, livekit → `/live/[id]/room`), new **View** item → detail
  page (previously unreachable from the table), detail page Join fixed (was
  sending external sessions into the SFU room), and the room route now
  redirects external sessions to their vendor URL (enrollment-gated).
- **Private/public control:** new `Conference.visibility` —
  `section` (default; exact previous behavior) | `school` (any member of the
  school: students PARTICIPANT, guardians OBSERVER, staff/accountant
  PARTICIPANT). Enforced in `resolveParticipantRole` (tokens),
  `canAccessSession` (recordings + detail), and every list read
  (`buildLiveClassWhere` OR, `listForStudent`/`listForGuardian`). No
  cross-school or anonymous tier exists — tenant boundary absolute.
- **Closed an enrollment leak (P1):** rich `getLiveClass` (sessions.ts) — a
  public server action — returned any same-school session **including
  meetingUrl** to any STUDENT/GUARDIAN. Now gated with `canAccessSession`
  (NOT_FOUND semantics), staff/ACCOUNTANT read unchanged.
- **Scheme-locked URLs (P1):** zod `.url()` admits `javascript:`/`data:`
  URIs; meetingUrl (create+update) and resource links now require http(s) —
  they render as `<a href>`/`window.open` targets.
- **References:** `Conference.catalogLessonId` (one FK → lesson's videos,
  attachments, materials, practice-question count on the detail page) + new
  `ConferenceResource` rows (exactly one of `schoolExamId` (quiz =
  `examType: QUIZ`) / `schoolAssignmentId` / http(s) url; tenant-verified
  before write; replace-all on update). Picker data via
  `getLiveClassReferenceOptions` (staff-gated, fetched per-subject on step
  entry — never on mount).
- **Compact wizard:** `form.tsx` rebuilt on the house stepped-modal idiom
  (classes/events/invoice) — 5 steps × ≤4 fields (Basics / Schedule /
  Meeting / References / Access) in `form-steps.tsx`, per-step
  `form.trigger`, `ModalFooter` step ratio, edit-safe (provider immutable),
  full en/ar dictionary coverage.
- **Timetable embed:** weekly grid (`simple-grid.tsx`) now shows a live-now
  pulse / scheduled-today dot per slot for ALL roles incl. admin
  (`getLiveClassIndicators` fetched inside the existing weekly queries —
  closes "admin has zero live-class affordance" at the indicator level).
- **Attendance embed:** fixed the `AttendanceMethod` type drift — the union
  now derives from Prisma, so VIRTUAL (and KIOSK) rows render labeled
  ("Live Class"/"حصة مباشرة") and are **no longer silently excluded from CSV
  exports** (both selected-methods defaults + checkbox lists).
- **School-wide notifications:** `visibility: school` sessions fan out to
  every school member through the hub (per-user channel prefs still honored).
- **Ops:** `cleanup-notifications` cron now also prunes
  `NotificationDeliveryLog` >90d (largest table in prod, 127 MB, had NO
  retention).

**DB (pending — Neon project at its 512 MB size cap):** additive DDL staged
at `scratchpad/live_visibility_resources_ddl.sql` (enum
`LiveClassVisibility`, `visibility` + `catalogLessonId` columns + FK,
`live_class_resources` table + FKs/indexes). Apply with
`cat scratchpad/live_visibility_resources_ddl.sql | pnpm prisma db execute --stdin --url "$DATABASE_URL"`
once space frees (options: approve a one-time >90d delivery-log prune, or
the planned account#1 toggle-back). Until applied, `/live` reads that
select the new columns will fail — deploy after DDL.

- [x] **Apply staged visibility/resources DDL** — **verified applied in prod
      2026-08-12** (information_schema check: `visibility` +
      `catalogLessonId` columns, `live_class_resources` table, FKs/indexes
      all present; `LiveClassVisibility` enum = section,school). The staged
      copy at `scratchpad/live_visibility_resources_ddl.sql` is now
      historical. The June-20 attendance-sync DDL is likewise confirmed LIVE.

### Integration optimization pass (2026-06-20)

Closed the integration seams with notifications, timetable, and attendance.
tsc 0; conference + timetable-join + cron + i18n suites green (227 conference-area
tests, 6 new for the attendance sync).

- **Notifications now actually deliver (P0):** the external-link path
  (`list-actions.ts` — the only live backend until LiveKit lands) fired NO
  notifications on create/update/delete. Wired `notifyClassScheduled` into
  `createLiveClass`, a re-notify (or `notifyClassCancelled` on status→cancelled)
  into `updateLiveClass`, and `notifyClassCancelled` into `deleteLiveClass`.
- **Consolidated onto the notification hub:** `actions/notifications.ts dispatch()`
  no longer writes `db.notification.createMany` directly. It keeps its
  section-roster + guardian fan-out (`loadSession`) and renders the inline
  TEMPLATES, then calls `dispatchNotificationsToAudience({ …, targetUserIds })`.
  Net: the email channel now fires (was dead — no `channels` field), per-user
  channel preferences are honored, `expiresAt` is set, the title/body is
  `prewarm`ed, and the email action button resolves (metadata `route`→`url`,
  absolutified by the hub). Added a `targetUserIds?: string[]` short-circuit to
  `dispatchNotificationsToAudience` (`src/lib/dispatch-notification.ts`) — any
  block with a custom audience can reuse it.
- **Guardian Join button (timetable):** new `getChildTodaySchedule` action
  (mirrors the STUDENT branch of `getTodaySchedule` behind the guardian-access
  gate, attaches `liveClass` via `attachLiveClasses`); `guardian-view.tsx` now
  loads it in parallel and renders `<LiveJoinButton>` on the Current/Next card.
- **Attendance-from-conference (new, opt-in, LiveKit-only):**
  `actions/attendance-sync.ts syncLiveAttendance` marks each section
  student PRESENT/LATE from participant presence and ABSENT for roster
  non-joiners when a session ends. Called from the webhook `room_finished`
  (count-guarded) and a new `/api/cron/end-stale-live-classes` (`*/15`) backstop
  that also closes sessions stuck `live` past `scheduledEnd`+30m. Gated per-school
  by `School.conferenceAttendanceSync` (new toggle on `/live/settings`).
  New `AttendanceMethod.VIRTUAL`. **DB additive deploy-pending** (enum value +
  `School.liveClassAttendanceSync` column) — Neon branch-first, then promote.
  Idempotent + soft-delete-revive on the section unique key.
- **Note:** the create-from-timetable double-create race is already mitigated
  client-side (`StartLiveClassButton` `useTransition`/`disabled`); the residual
  concurrent-millisecond race is accepted (no Prisma-expressible partial unique).

### Hardening pass — adversarial review fixes (2026-06-13)

24 confirmed findings from a multi-agent adversarial review, all fixed
(tsc 0; 211/211 conference unit tests green). i18n "always-English" findings
on detail/recordings/empty-state/schedule-form were FALSE POSITIVES — the real
dictionary source is `dictionaries/{en,ar}/live-classes.json` (not school-\*.json)
and already has every key.

- **RBAC (P1):** `list-actions.ts` `getLiveClasses`/`getLiveClass`/`getLiveClassFormData`
  exposed every session (incl. `meetingUrl`) + rosters to STUDENT/GUARDIAN.
  Added `resolveViewerSectionScope` (queries.ts) — STUDENT/GUARDIAN now see only
  their own section's sessions; form rosters are staff-only. Same scope applied
  to the SSR path in `content.tsx`.
- **Concurrent cap (P1):** `startLiveClass` silently bypassed the cap when the
  school row was missing; the `joinLiveClass` HOST auto-start path skipped it
  entirely. Extracted `concurrentCapError()` helper, used by both.
- **Tenant scoping (P1/P3):** added `schoolId` to webhook `egress_ended` +
  participant updates + a cross-tenant pre-check on `egress_started`;
  `kickParticipant` now scopes the update + verifies the participant row;
  `carryForwardLiveLinks` validates both terms belong to the school.
- **State guards (P2):** webhook `room_started`/`room_finished` are now
  status-guarded `updateMany`s (no resurrecting ended/cancelled rows, no
  duplicate notify/egress); `endLiveClass` rejects scheduled/failed.
- **Recording (P1/P3):** `list-actions.createLiveClass` now honors the section
  opt-out; webhook creates a `pending` recording row on room_started to close
  the early-end egress race; direct BigInt for file size; per-region S3 client
  cache (the old region-compare singleton never held).
- **Providers (P1/P2/P3):** Teams `isConfigured()` now requires
  `AZURE_ORGANIZER_ID`; Google Meet `requestId` carries a per-session id (no
  idempotency-key collision); a configured-provider `createMeeting` failure
  surfaces an error instead of silently faking success; token-cache dedups
  in-flight exchanges.
- **i18n / UX (P2):** network-test quality/path values now translate;
  schedule-form renders a translated error (not the raw `UNAUTHORIZED` code);
  section opt-out optimistic-revert restores the true pre-toggle value;
  network-test page issues a PARTICIPANT (not HOST) diagnostic token with the
  real schoolId and a non-parseable room name.
- **Observability (P3):** TURN-fallback rate scoped to joined participants;
  `0n` BigInt fallback. **Capacity dashboard** + **per-section opt-out** closed
  above.

Decision left as-is (documented, not a bug): a non-owning TEACHER joins as
CO_HOST (publish) — intentional co-teaching per the role model; revisit if
stricter per-section teacher scoping is wanted.

### Docs pass (2026-06-13)

- [x] Rewrote `content/docs-{en,ar}/live.mdx` to match the real code
      (Structure-first; added `participants-panel`, `section-recording-policy`,
      `network-protocol`, `token-cache`; providers relabeled wired/dark; two-layer
      permission model + data-flow documented).
- [x] Structure section now renders `<ConferenceStructure />` (registered the
      component in `src/mdx-components.tsx`; refreshed its node tree in
      `src/components/docs/live-structure.tsx`).
- [x] Deleted the stale pre-rename docs `content/docs-{en,ar}/live-classes.mdx`
      and de-registered them from both `meta.json` + regenerated `.source`.
- [x] Rewrote `README.md` (was still titled "Live Classes" with a nested layout
      that no longer exists); fixed `CLAUDE.md` stale facts.

### Maturity pass (2026-06-06)

- [x] In-room HOST moderation UI (`participants-panel.tsx` + kick wiring).
- [x] Real ICE-path detection in `network-test.tsx` (`network-protocol.ts`
      `classifyFromStats` → direct-udp / turn-udp / turn-tcp-443).
- [x] Timetable "Start live class" button + `createLiveClassFromTimetable`.
- [x] Native provider adapters implemented (`providers/{google-meet,zoom,teams}`
      real OAuth + createMeeting) + wired into the create flow behind
      `isConfigured()` (ships dark until OAuth creds land).
- [x] `stopEgress` wired into `endLiveClass`; `carryForwardLiveLinks`
      exposed as an admin button on `/live/settings`.
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

---

## 2026-09-01 — the block becomes `live`, and the landing page becomes a tool

Two passes in one, both closed.

### The rename: `conference` → `live` (`/live`, "Live" / "مباشر")

The block answered to three names at once — sidebar `مباشر`, page heading
`الاجتماعات` ("Meetings", a conference event rather than a school lesson), and
a breadcrumb reading an untranslated `"Conference"`. The breadcrumb was not a
missing translation but a missing KEY: the sidebar config's English `title`
doubles as a dictionary key, and the two consumers look it up differently —
`sidebar[item.title]`, which existed, versus
`breadcrumb[item.title.toLowerCase()]`, which did not.

- [x] Block source (92 files) + tests (37) moved; 94 importers rewritten
- [x] The 9 route files moved, `public/conference` with them
- [x] `/conference/*` and `/live-classes/*` both redirect to `/live/*`, one hop
      each, neither chained
- [x] `routes.ts` role matrix, the 4 `revalidatePath` sites, every URL literal
- [x] Our ~28 `Conference*` identifiers became `Live*`, word-boundary matched
- [x] Docs moved to `/docs/live`; `LiveStructure` node tree matches the new files
- [x] Dead `permissions.ts` deleted — its `getTabsForRole` was shadowed by
      `list-permissions.ts`, and its only importer in the repo was its own test

**Deliberately NOT renamed**, and each for a reason that would cost data:

- The Prisma models, enums and `School`/`Section` `conference*` columns are
  DB-mapped; renaming them is a migration.
- `localize("Conference", …)` / `prewarm("Conference", …)` is the translation
  cache's identity key — renaming it orphans every cached row.
- `/api/conference/token` and `/api/mobile/conference/[id]/join` — a shipped
  mobile client calls them.
- `key: "liveClasses"` in `platform-sidebar/config.ts` is matched against the
  `School.enabledModules` JSON column. **Renaming it silently hides the sidebar
  entry for every school that has configured its modules.**

"Conference" is now the data-model name and "Live" the product name — the same
split the stream→lumos rename kept.

⚠ **The `/conference` redirect stub is permanent, not transitional.**
`actions/notifications.ts` stored `/conference/{id}` into
`Notification.metadata.url`, kept relative and absolutified only at render, so
every notification already in production points there forever. Its header says
so. Do not delete it in a cleanup.

### The landing page

It was a brochure for a feature the school already owns — four marketing cards,
a value band, a setup guide and a Google-artwork closing band, with the day's
live classes third on a 2,651px page. And it was not role-aware: all seven roles
saw the same thing, so a **student was told to "turn on online teaching, from
settings"** — a page they cannot open — on every visit, above a strip of their
own classes.

- [x] One page, two states: a TOOL when the school teaches online, a SETUP
      GUIDE (admins only) when it does not. The old marketing copy survives —
      it was good, just shown to the wrong people forever.
- [x] `status-hero.tsx` — the headline states what is happening; the block name
      moved to the eyebrow, which also settles a collision (`مباشر` is already
      this block's word for a running session). Arabic inflects a counted noun
      five ways, so the count picks its form via `Intl.PluralRules` rather than
      gluing a number onto a plural.
- [x] `readiness-band.tsx` — **new**. Delivery mode · meeting back-end · link
      coverage · recording · in-app rooms, each linking to where it is fixed.
      Every signal already existed but lived across three surfaces.
- [x] Session cards carry their subject's catalog thumbnail (`Subject` IS the
      catalog subject; `Conference.subjectId` reaches it with no extra join),
      falling back to the subject's colour.
- [x] Joining is one click again — live sessions link into the room, not the
      detail page.
- [x] `landing/viewer.ts` — the five role lists live once and are tested.
- [x] 3.0 MB of `public/` deleted: Google's own Meet artwork (flagged here since
      August), a stock hero photo, and three orphaned room tiles.

Page height roughly halved. tsc 0 · 601 block tests green (+21).

### Found while here, NOT fixed

- **`degraded` is now visible but still happens**: the demo school asks for
  in-app rooms and is silently served external links because the SFU is
  unprovisioned. The band says so; the provisioning is `RUNBOOK.md`'s six gates.
- **Link coverage on the demo is 3/180 with no standing link** — 177
  section+subject pairs would materialize _nothing_. Real data problem the band
  surfaced on its first render, not a code bug.
- **The onboarding tour modal covers the hero** on every page in the platform.
  Out of scope here — it is `WelcomeDialog` in the school-dashboard layout.
- **STAFF can be deep-linked into a room it cannot enter.** `resolveViewerSectionScope`
  gives STAFF the whole school, so the strip shows it every live session and
  links into the room — but `resolveParticipantRole` only admits STAFF to
  `visibility: "school"` sessions. The room page's error path returns them to
  the session detail, so it degrades rather than breaks. Narrowing the strip's
  CTA for STAFF would need a per-row visibility check the landing does not
  currently select.
