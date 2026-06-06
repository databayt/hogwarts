// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Microsoft Teams via the Microsoft Graph API (`onlineMeetings`).
//
// WAVE 4 — SCAFFOLD, awaiting credentials. To activate:
//   1. An Azure AD app registration with Graph `OnlineMeetings.ReadWrite` (app
//      permission + admin consent; application access policy for the school).
//   2. env: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
//   3. Implement createMeeting (POST /users/{host}/onlineMeetings), getRecording
//      (callRecordings / Stream), getAttendance (GET /onlineMeetings/{id}/
//      attendanceReports).

import {
  type ConferenceProviderAdapter,
  ProviderNotImplementedError,
} from "./types"

function configured(): boolean {
  return Boolean(
    process.env.AZURE_TENANT_ID &&
      process.env.AZURE_CLIENT_ID &&
      process.env.AZURE_CLIENT_SECRET
  )
}

export const teamsAdapter: ConferenceProviderAdapter = {
  id: "teams",
  isConfigured: configured,
  async createMeeting() {
    throw new ProviderNotImplementedError("teams", "createMeeting")
  },
  async getRecording() {
    throw new ProviderNotImplementedError("teams", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("teams", "getAttendance")
  },
}
