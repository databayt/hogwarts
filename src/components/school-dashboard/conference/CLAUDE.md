# Conference Block

## Context

Video conferencing for schools — one self-contained block at
`src/components/school-dashboard/conference/`, mirrored 1:1 to `/conference`.
Three meeting back-ends behind one UI: **external pasted-link** (live
everywhere, zero infra), **LiveKit SFU** (in-app rooms + recording — fully
coded, dormant until infra), and **native Meet / Zoom / Teams** (`createMeeting`
wired per vendor API, dark until OAuth creds). Originally built for the Aldar
UAE pilot (Epic 03 — kun.databayt.org/en/docs/aldar): self-hosted SFU on G42
Cloud with TURN-over-443-TCP fallback for UAE VoIP throttling; recordings to
AWS S3 `me-central-1` with PDPL-configurable retention.

> The folder was renamed `live-classes/` → `conference/` and the models
> `LiveClass*` → `Conference*` (DB tables/columns/enums preserved via
> `@@map`/`@map` — zero-change migration). Code symbols and dictionary keys
> still use the `liveClass` / `live_class_*` spelling; the route, block, and
> models use `conference`. The legacy `/docs/live-classes` pages were deleted.

## Before You Start

1. Read `README.md` here for file inventory + routes
2. Read `ISSUE.md` for the open backlog
3. The Prisma models live in `prisma/models/conference.prisma` (renamed from
   `live-class.prisma`; `Conference*` model names, DB tables preserved via `@@map`):
   - `Conference` — scheduled or ad-hoc session (`provider`, `meetingUrl?`, `meetingProvider?`)
   - `ConferenceParticipant` — one row per invited user (host / student / observer) + telemetry
   - `ConferenceRecording` — composite Egress recording metadata + S3 location + `expiresAt`
   - `ConferenceEvent` — webhook audit log + `eventId @unique` idempotency
   - `ConferenceLink` — set-once recurring link `[schoolId, subjectId, sectionId, termId]`
4. LiveKit lib wrappers in `livekit/`:
   - `client.ts` (singletons + `isLiveKitConfigured`/`getLiveKitReadiness`), `token.ts` (JWT),
     `rooms.ts`, `egress.ts`, `recording-urls.ts`, `webhook.ts`, `room-naming.ts`
5. Link-provider adapters in `providers/` (`types`, `external` live, `google-meet`/`zoom`/`teams`
   wired-but-dark, `token-cache`, `index` registry).
6. The plan: `~/.claude/plans/read-https-kun-databayt-org-en-docs-alda-swift-mango.md`

## Key Decisions

- **Room naming**: `sch-{schoolId}-lc-{sessionId}` — globally unique and
  embeds the tenant boundary, so the SFU namespace can't leak across
  schools and the webhook handler recovers `schoolId` from the room name
  alone via `parseRoomName()` (`livekit/room-naming.ts`).
- **Token TTL is 5 minutes** with client-side refresh ~60s before expiry
  (see `room.tsx`). Refresh re-runs the eligibility check, so
  revoked access takes effect at the **next refresh boundary** — revocation
  latency = TTL (≤5 min), NOT instant. LiveKit JWTs are stateless; there is
  no server-side invalidation of an already-issued token (no `removeParticipant`
  is wired to access-revoke). `tokenIssuedAt` is reserved for future instant
  revocation but is not yet read.
- **Role → LiveKit grants** mapping is in `livekit/token.ts`:
  HOST = full + roomAdmin, CO_HOST = publish + subscribe, PARTICIPANT
  = publish + subscribe, OBSERVER = subscribe only.
- **Participant eligibility** is resolved per-join in `actions/tokens.ts`
  by joining Student.sectionId / Guardian.studentGuardians against the
  session's sectionId. No pre-fanout — invitations are lazy.
- **State machine**: `scheduled → live → ended` (or `cancelled` /
  `failed`). State transitions are guarded by server actions in
  `actions/sessions.ts` and return `LIVE_CLASS_INVALID_STATE` on
  violation. The webhook handler is the authoritative writer for the
  `live` and `ended` transitions (room_started / room_finished events).
- **Recording lifecycle**: `pending → processing → ready → expired`. We
  populate `s3Bucket` + `s3Region` on `egress_started` (from
  `getLiveKitConfig()`) so playback can sign URLs as soon as
  `egress_ended` arrives. Retention cron at `/api/cron/expire-live-recordings`
  enforces per-school retention.
- **Recordings live in AWS S3 `me-central-1`** (PDPL via region, not
  premises). Decision locked in plan — escalate if Aldar procurement
  bounces "cloud". Bucket name from `LIVEKIT_RECORDING_BUCKET`.
- **Notifications are best-effort**: dispatched via `void` from actions
  - webhook. Notification failures must never roll back the underlying
    state transition. See `actions/notifications.ts`.
- **Bare room layout**: full-screen LiveKit UI lives under
  `src/app/[lang]/s/[subdomain]/(live-room)/` (NOT under
  `(school-dashboard)`) so it can use a minimal layout without sidebar.
- **Two permission/validation layers, on purpose**: the _rich sessions layer_
  (`authorization.ts` · `permissions.ts` · `validation.ts`) is the strict
  runtime gate for the LiveKit room flow (join / token / start / end); the
  _list layer_ (`list-permissions.ts` · `list-validation.ts` · `list-actions.ts`)
  is the CRUD gate for the dashboard table + external-link sessions. They diverge
  deliberately (list `WRITE_ROLES` is broader). Don't collapse them.
- **Provider abstraction**: link providers live in `providers/` behind a single
  `ConferenceProviderAdapter`. `external` is the floor; natives create real
  meetings via vendor APIs but persist as `provider="external"` +
  `meetingProvider="<id>"` → **no enum migration**. LiveKit's SFU lifecycle is
  intentionally OUTSIDE this layer (room-based, not link-based).
- **Per-section recording opt-out**: `setSectionRecordingOptOut` (`actions/settings.ts`)
  overrides the school-wide `conferenceRecordingDefault` per section.
- **Docs structure is component-driven**: the `## Structure` section of
  `content/docs-{en,ar}/conference.mdx` renders `<ConferenceStructure />` from
  `src/components/docs/conference-structure.tsx` (registered in `src/mdx-components.tsx`).
  When you add/rename block files, update that component's node tree — NOT a code
  fence in the mdx.

## Danger Zones

- **Tenant leak**: every read/write MUST filter by `schoolId` resolved
  from `getTenantContext()` — never from client input. `getLiveClass`
  in `actions/sessions.ts` resolves `schoolId` by trying dashboard,
  student, and guardian permissions in turn; if none match it returns
  UNAUTHORIZED rather than falling through to a global lookup.
- **Webhook signature**: `/api/webhooks/livekit/route.ts` verifies HMAC
  via `WebhookReceiver.receive()` before touching the DB. Don't bypass.
- **Webhook idempotency**: `ConferenceEvent.eventId` is `@unique`. The
  handler checks for an existing row before mutating — preserves
  at-least-once delivery semantics.
- **Room name parsing**: `parseRoomName()` is the only way to recover
  `schoolId` from a webhook. If a malformed roomName arrives, the
  handler drops it silently rather than guessing a tenant.
- **NotificationType enum drift**: 5 sync points must stay in lockstep
  with `prisma/models/notifications.prisma`:
  `notifications/config.ts` (`NOTIFICATION_TYPE_CONFIG` +
  `NOTIFICATION_EXPIRATION`), `notifications/validation.ts`
  (`notificationTypeSchema`), `notifications/email-service.ts`
  (`typeLabels` × 2 languages), `dictionaries/{en,ar}/notifications.json`
  (`types` map). Tests in `notifications/__tests__/config.test.ts`
  fail loudly on the first three; the dictionary + email-service drift
  silently.
- **`LIVEKIT_S3_ACCESS_KEY` / `LIVEKIT_S3_SECRET`**: only used by the
  LiveKit SFU process to PUT objects. The Next.js app reads recordings
  with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` via the existing
  S3 signer. Do not conflate.
- **List-layer reads must role-scope** (added 2026-06-13): `list-actions.ts`
  `getLiveClasses`/`getLiveClass` and the `content.tsx` SSR path MUST run rows
  through `resolveViewerSectionScope()` — STUDENT/GUARDIAN see only their own
  section's sessions (a session row carries `meetingUrl`). `getLiveClassFormData`
  is staff-only. The list-layer permission files gate writes, NOT reads — don't
  assume a role check upstream covers a new read.
- **Concurrent cap goes through `concurrentCapError()`** (helpers.ts): both
  `startLiveClass` (sessions.ts) and the HOST auto-start branch of `joinLiveClass`
  (tokens.ts) call it. A missing school row is a hard error — never `if (school && …)`
  (that silently bypasses the cap). Any new "start a room" path must call it too.
- **Webhook writes are status-guarded `updateMany`** scoped by `{ id, schoolId, status }`
  — never a bare `update({ where: { id } })`. A late/retried event must be a no-op,
  not a state resurrection.

## Related Blocks

- [Notifications](../notifications/CLAUDE.md) — dispatches 5 new
  `live_class_*` notification types
- [Timetable](../timetable/) — anchors scheduled sessions
  (`Conference.timetableId` is optional)
- [Sections](../listings/students/) — `Section.students` is the
  enrollment source for student-join eligibility

## Demo / Test

Phase 1 ships with no demo seed — schedule a class via the UI from
`admin@databayt.org` (pw `1234`) on `demo.localhost:3000` once env vars
are configured.

Required env vars (set in `.env`):

- `LIVEKIT_HOST` — e.g. `https://livekit.databayt.org`
- `LIVEKIT_WS_URL` — e.g. `wss://livekit.databayt.org`
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
- `LIVEKIT_RECORDING_BUCKET` — S3 bucket name
- `LIVEKIT_RECORDING_REGION` — default `me-central-1`
- `LIVEKIT_S3_ACCESS_KEY` / `LIVEKIT_S3_SECRET` — for SFU egress writes
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — for app-side playback
  signing (separate from SFU credentials)

## After You Finish

1. Update `ISSUE.md` and `README.md` here
2. Update the docs if user-facing: `content/docs-{en,ar}/conference.mdx`
   (Structure section is `<ConferenceStructure />` — edit the component)
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Run the conference specs under `src/tests/` (tests were moved out of an
   in-block `__tests__/` folder in the URL-mirror reorg) — should stay green
5. **Before any Prisma changes**: create a Neon branch via
   `mcp__Neon__create_branch`, test on the branch, then promote
