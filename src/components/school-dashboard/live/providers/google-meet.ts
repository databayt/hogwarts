// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Google Meet via the Google Calendar API (`conferenceData.createRequest`).
//
// Activation needs a Google Cloud project with the Calendar API enabled and an
// OAuth client (or a service account with domain-wide delegation) so the
// school's Workspace can mint Meet links. env: GOOGLE_MEET_CLIENT_ID,
// GOOGLE_MEET_CLIENT_SECRET, GOOGLE_MEET_REFRESH_TOKEN. createMeeting is wired;
// getRecording/getAttendance stay deferred (Workspace Enterprise scopes).

import { randomUUID } from "node:crypto"

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
    process.env.GOOGLE_MEET_CLIENT_ID &&
    process.env.GOOGLE_MEET_CLIENT_SECRET &&
    process.env.GOOGLE_MEET_REFRESH_TOKEN
  )
}

/** Exchange the long-lived refresh token for a short-lived access token. */
async function getAccessToken(): Promise<string> {
  return getCachedToken("google_meet", async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_MEET_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_MEET_CLIENT_SECRET ?? "",
        refresh_token: process.env.GOOGLE_MEET_REFRESH_TOKEN ?? "",
        grant_type: "refresh_token",
      }),
    })
    if (!res.ok) {
      throw new Error(`Google OAuth token exchange failed (${res.status})`)
    }
    const json = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!json.access_token) {
      throw new Error("Google OAuth returned no access_token")
    }
    return { token: json.access_token, expiresInSec: json.expires_in ?? 3600 }
  })
}

export const googleMeetAdapter: ConferenceProviderAdapter = {
  id: "google_meet",
  isConfigured: configured,

  async createMeeting(input: CreateMeetingInput): Promise<MeetingResult> {
    if (!configured()) throw new ProviderNotConfiguredError("google_meet")
    const token = await getAccessToken()

    // Idempotency key: stable per session so a retry returns the same
    // conference, but unique across sessions so two classes at the same school +
    // start time don't collapse onto one Meet link. Falls back to a random
    // suffix when no sessionId is threaded through.
    const requestId = `lc-${input.schoolId}-${
      input.sessionId ?? randomUUID().slice(0, 8)
    }-${input.scheduledStart.getTime()}`
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: input.title,
          start: { dateTime: input.scheduledStart.toISOString() },
          end: { dateTime: input.scheduledEnd.toISOString() },
          conferenceData: {
            createRequest: {
              requestId,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    )
    if (!res.ok) {
      throw new Error(`Google Calendar event create failed (${res.status})`)
    }
    const json = (await res.json()) as {
      id?: string
      hangoutLink?: string
      conferenceData?: {
        entryPoints?: Array<{ entryPointType?: string; uri?: string }>
      }
    }
    const video = json.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri
    const joinUrl = video ?? json.hangoutLink
    if (!joinUrl) throw new Error("Google Meet returned no join URL")
    return { provider: "google_meet", externalId: json.id ?? "", joinUrl }
  },

  async getRecording() {
    throw new ProviderNotImplementedError("google_meet", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("google_meet", "getAttendance")
  },
}
