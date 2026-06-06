# Conference — Provider Adapters (Wave 4 scaffold)

A unified interface for **link-based** meeting providers. The LiveKit SFU path is **not** here — its
room/token/egress/webhook lifecycle stays in the block's existing actions. This layer is the seam for
auto-generating links and syncing recordings/attendance from native provider APIs.

## Status

| Provider | id | State | Env it needs |
| --- | --- | --- | --- |
| External link | `external` | ✅ functional | — (host pastes any URL) |
| Google Meet | `google_meet` | 🟡 scaffold (stub) | `GOOGLE_MEET_CLIENT_ID`, `GOOGLE_MEET_CLIENT_SECRET`, `GOOGLE_MEET_REFRESH_TOKEN` |
| Zoom | `zoom` | 🟡 scaffold (stub) | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` |
| Microsoft Teams | `teams` | 🟡 scaffold (stub) | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` |

The stubs throw `ProviderNotImplementedError` until credentials land. `isConfigured()` already reflects
whether each provider's env is present, so the UI can show/hide a provider without code changes.

## The interface (`types.ts`)

```ts
interface ConferenceProviderAdapter {
  id: ProviderId
  isConfigured(): boolean
  createMeeting(input): Promise<MeetingResult>       // join URL (echoed / API-generated)
  getRecording(externalId): Promise<RecordingResult | null>
  getAttendance(externalId): Promise<AttendanceRecord[]>   // real telemetry, not clicked-Join
}
```

Resolve via `getProviderAdapter(id)`; list with `listProviderAdapters()` / `configuredProviderIds()`.

## Storage

Native providers persist as `Conference.provider = "external"` + `Conference.meetingProvider = "<id>"`,
so **no Prisma enum migration is required** to ship them — the `meetingProvider` string already
distinguishes Meet/Zoom/Teams on an external row.

## To activate a provider (what you must provision)

1. **Google Meet** — Google Cloud project + Calendar API; OAuth client or service account with
   domain-wide delegation for the school's Workspace. Implement `createMeeting` via `events.insert`
   with `conferenceData.createRequest`.
2. **Zoom** — a Marketplace *Server-to-Server OAuth* app on the school account. Implement
   `createMeeting` via `POST /users/{host}/meetings`.
3. **Teams** — Azure AD app registration with Graph `OnlineMeetings.ReadWrite` (app permission +
   admin consent + application access policy). Implement `createMeeting` via
   `POST /users/{host}/onlineMeetings`.

Once an adapter's `createMeeting` is implemented and its env is set, wire it into the create flow
(`actions/sessions.ts` / `list-actions.ts`) by branching on the chosen `meetingProvider` and calling
`getProviderAdapter(meetingProvider).createMeeting(...)` instead of storing a pasted URL.

## Why LiveKit isn't an adapter here

LiveKit is a self-hosted SFU with a fundamentally different lifecycle (in-app rooms, JWT grants,
Egress recording, webhook-driven state). Forcing it behind this link-oriented interface would
duplicate working code. It remains the premium SFU path; this layer is for link providers.
