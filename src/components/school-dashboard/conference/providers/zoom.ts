// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Zoom via the Zoom Meetings API (server-to-server OAuth).
//
// WAVE 4 — SCAFFOLD, awaiting credentials. To activate:
//   1. A Zoom Marketplace "Server-to-Server OAuth" app for the school account.
//   2. env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
//   3. Implement createMeeting (POST /users/{host}/meetings), getRecording
//      (GET /meetings/{id}/recordings), getAttendance (GET /report/meetings/
//      {id}/participants — paid plan).

import {
  type ConferenceProviderAdapter,
  ProviderNotImplementedError,
} from "./types"

function configured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
  )
}

export const zoomAdapter: ConferenceProviderAdapter = {
  id: "zoom",
  isConfigured: configured,
  async createMeeting() {
    throw new ProviderNotImplementedError("zoom", "createMeeting")
  },
  async getRecording() {
    throw new ProviderNotImplementedError("zoom", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("zoom", "getAttendance")
  },
}
