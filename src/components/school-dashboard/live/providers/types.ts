// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Conference provider adapters — a unified interface for LINK-based meeting
// providers (a generic pasted `external` URL + the native Google Meet / Zoom /
// Teams APIs). The LiveKit SFU path is intentionally NOT part of this layer:
// its room / token / egress / webhook lifecycle is owned by the block's existing
// actions. This is the "Phase D" seam from the conference doc — auto-generating
// links + syncing recordings/attendance — scaffolded ahead of OAuth credentials.
//
// Storage note: native providers are persisted as `provider = "external"` +
// `meetingProvider = "<id>"`, so activating them needs NO Prisma enum change.

export type ProviderId = "external" | "google_meet" | "zoom" | "teams"

export interface CreateMeetingInput {
  schoolId: string
  title: string
  scheduledStart: Date
  scheduledEnd: Date
  hostUserId: string
  /**
   * Stable per-session disambiguator (e.g. the Conference id or a pre-generated
   * UUID). Providers that use an idempotency key (Google Meet's
   * `conferenceData.createRequest.requestId`) MUST include it so two concurrent
   * classes at the same school + start time don't collapse onto one meeting.
   */
  sessionId?: string
  /** Generic `external` provider only: the user-supplied URL to wrap. */
  meetingUrl?: string
}

export interface MeetingResult {
  provider: ProviderId
  /** Provider-native meeting id (empty string for the generic external link). */
  externalId: string
  /** URL participants open to join. */
  joinUrl: string
}

export interface RecordingResult {
  url: string
  durationSeconds?: number
  sizeBytes?: number
  expiresAt?: Date
}

export interface AttendanceRecord {
  userId?: string
  displayName: string
  joinedAt: Date
  leftAt?: Date
  durationSeconds: number
}

/**
 * The contract every link-based provider implements. `createMeeting` obtains a
 * join URL (echoed for external, API-generated for natives); `getRecording` and
 * `getAttendance` pull real post-call signal where the provider exposes it.
 */
export interface ConferenceProviderAdapter {
  readonly id: ProviderId
  /** Credentials/config present for this provider (mirrors isLiveKitConfigured). */
  isConfigured(): boolean
  createMeeting(input: CreateMeetingInput): Promise<MeetingResult>
  getRecording(externalId: string): Promise<RecordingResult | null>
  getAttendance(externalId: string): Promise<AttendanceRecord[]>
}

export class ProviderNotImplementedError extends Error {
  constructor(
    public readonly provider: ProviderId,
    op: string
  ) {
    super(
      `Provider "${provider}" ${op} is not implemented yet (Wave 4 — awaiting OAuth credentials; see conference/providers/README.md)`
    )
    this.name = "ProviderNotImplementedError"
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(public readonly provider: ProviderId) {
    super(
      `Provider "${provider}" is missing credentials — see conference/providers/README.md`
    )
    this.name = "ProviderNotConfiguredError"
  }
}
