// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Generic external link provider — the host pastes any meeting URL (Meet/Zoom/
// Teams/Jitsi/…). No API, no auto-generation, no telemetry. This is the
// universal zero-infra default; it is fully functional today.

import type {
  ConferenceProviderAdapter,
  CreateMeetingInput,
  MeetingResult,
} from "./types"

export const externalAdapter: ConferenceProviderAdapter = {
  id: "external",
  isConfigured: () => true,

  async createMeeting(input: CreateMeetingInput): Promise<MeetingResult> {
    if (!input.meetingUrl) {
      throw new Error("external provider requires a user-supplied meetingUrl")
    }
    return { provider: "external", externalId: "", joinUrl: input.meetingUrl }
  },

  // A pasted link exposes no recording or attendance signal — attendance is the
  // "clicked Join" proxy only (tracked at the app layer, not here).
  async getRecording() {
    return null
  },
  async getAttendance() {
    return []
  },
}
