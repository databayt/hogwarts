// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Zoom via the Zoom Meetings API (server-to-server OAuth).
//
// Activation needs a Zoom Marketplace "Server-to-Server OAuth" app for the
// school account. env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
// createMeeting is wired; getRecording/getAttendance stay deferred (attendance
// reports need a paid plan).

import { getCachedToken } from "./token-cache"
import {
  ProviderNotConfiguredError,
  ProviderNotImplementedError,
  type ConferenceProviderAdapter,
  type CreateMeetingInput,
  type MeetingResult,
} from "./types"

function configured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  )
}

/** Server-to-server OAuth: account-credentials grant with Basic client auth. */
async function getAccessToken(): Promise<string> {
  return getCachedToken("zoom", async () => {
    const basic = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString("base64")
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
        process.env.ZOOM_ACCOUNT_ID ?? ""
      )}`,
      { method: "POST", headers: { Authorization: `Basic ${basic}` } }
    )
    if (!res.ok) {
      throw new Error(`Zoom OAuth token exchange failed (${res.status})`)
    }
    const json = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!json.access_token) {
      throw new Error("Zoom OAuth returned no access_token")
    }
    return { token: json.access_token, expiresInSec: json.expires_in ?? 3600 }
  })
}

export const zoomAdapter: ConferenceProviderAdapter = {
  id: "zoom",
  isConfigured: configured,

  async createMeeting(input: CreateMeetingInput): Promise<MeetingResult> {
    if (!configured()) throw new ProviderNotConfiguredError("zoom")
    const token = await getAccessToken()

    const durationMin = Math.max(
      1,
      Math.round(
        (input.scheduledEnd.getTime() - input.scheduledStart.getTime()) / 60_000
      )
    )
    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.title,
        type: 2, // scheduled
        start_time: input.scheduledStart.toISOString(),
        duration: durationMin,
        timezone: "UTC",
      }),
    })
    if (!res.ok) {
      throw new Error(`Zoom meeting create failed (${res.status})`)
    }
    const json = (await res.json()) as {
      id?: number | string
      join_url?: string
    }
    if (!json.join_url) throw new Error("Zoom returned no join_url")
    return {
      provider: "zoom",
      externalId: String(json.id ?? ""),
      joinUrl: json.join_url,
    }
  },

  async getRecording() {
    throw new ProviderNotImplementedError("zoom", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("zoom", "getAttendance")
  },
}
