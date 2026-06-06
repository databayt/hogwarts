// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Google Meet via the Google Calendar API (`conferenceData.createRequest`).
//
// WAVE 4 — SCAFFOLD, awaiting credentials. To activate:
//   1. Google Cloud project with the Calendar API enabled.
//   2. OAuth 2.0 client, or a service account with domain-wide delegation so the
//      school's Workspace can mint Meet links on teachers' behalf.
//   3. env: GOOGLE_MEET_CLIENT_ID, GOOGLE_MEET_CLIENT_SECRET, GOOGLE_MEET_REFRESH_TOKEN
//   4. Implement createMeeting (events.insert + conferenceData), getRecording
//      (Drive recording file), getAttendance (Meet attendance report — Workspace
//      Enterprise only).

import {
  type ConferenceProviderAdapter,
  ProviderNotImplementedError,
} from "./types"

function configured(): boolean {
  return Boolean(
    process.env.GOOGLE_MEET_CLIENT_ID && process.env.GOOGLE_MEET_CLIENT_SECRET
  )
}

export const googleMeetAdapter: ConferenceProviderAdapter = {
  id: "google_meet",
  isConfigured: configured,
  async createMeeting() {
    throw new ProviderNotImplementedError("google_meet", "createMeeting")
  },
  async getRecording() {
    throw new ProviderNotImplementedError("google_meet", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("google_meet", "getAttendance")
  },
}
