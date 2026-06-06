# Live-Classes Block

## Context

LiveKit-based video conferencing for school live classes. Built for the
Aldar UAE pilot (Epic 03 — kun.databayt.org/en/docs/aldar). Self-hosted SFU
on G42 Cloud with TURN-over-443-TCP fallback for UAE VoIP throttling.
Recordings to AWS S3 `me-central-1` with PDPL-configurable retention.

## Before You Start

1. Read `README.md` here for file inventory + routes
2. Read `ISSUE.md` for the open backlog
3. The 4 Prisma models live in `prisma/models/live-class.prisma`:
   - `Conference` — scheduled or ad-hoc class
   - `ConferenceParticipant` — one row per invited user (host / student / observer)
   - `ConferenceRecording` — composite Egress recording metadata
   - `ConferenceEvent` — webhook audit log + idempotency
4. LiveKit lib wrappers in `src/lib/livekit/`:
   - `client.ts` (singletons), `token.ts` (JWT), `rooms.ts`, `egress.ts`,
     `recording-urls.ts`, `webhook.ts`, `room-naming.ts`
5. The plan: `~/.claude/plans/read-https-kun-databayt-org-en-docs-alda-swift-mango.md`

## Key Decisions

- **Room naming**: `sch-{schoolId}-lc-{sessionId}` — globally unique and
  embeds the tenant boundary, so the SFU namespace can't leak across
  schools and the webhook handler recovers `schoolId` from the room name
  alone via `parseRoomName()` (`src/lib/livekit/room-naming.ts`).
- **Token TTL is 5 minutes** with client-side refresh ~60s before expiry
  (see `room/room-client.tsx`). Refresh re-runs the eligibility check, so
  revoked access takes effect at the **next refresh boundary** — revocation
  latency = TTL (≤5 min), NOT instant. LiveKit JWTs are stateless; there is
  no server-side invalidation of an already-issued token (no `removeParticipant`
  is wired to access-revoke). `tokenIssuedAt` is reserved for future instant
  revocation but is not yet read.
- **Role → LiveKit grants** mapping is in `src/lib/livekit/token.ts`:
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
2. Run `pnpm tsc --noEmit` to verify no regressions
3. `pnpm vitest run src/components/school-dashboard/conference src/lib/livekit`
   — should stay green (45 tests at last count)
4. **Before any Prisma changes**: create a Neon branch via
   `mcp__Neon__create_branch`, test on the branch, then promote
