// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Microsoft Teams via the Microsoft Graph API (`onlineMeetings`).
//
// Activation needs an Azure AD app registration with Graph
// `OnlineMeetings.ReadWrite` (app permission + admin consent + an application
// access policy for the school). env: AZURE_TENANT_ID, AZURE_CLIENT_ID,
// AZURE_CLIENT_SECRET, and AZURE_ORGANIZER_ID (the AAD object id that owns the
// meetings — app-only Graph cannot use `/me`). createMeeting is wired;
// getRecording/getAttendance stay deferred.

import { getCachedToken } from "./token-cache"
import {
  ProviderNotConfiguredError,
  ProviderNotImplementedError,
  type ConferenceProviderAdapter,
  type CreateMeetingInput,
  type MeetingResult,
} from "./types"

function configured(): boolean {
  // AZURE_ORGANIZER_ID is required: app-only Graph cannot use `/me`, and
  // falling back to the app's userId (a Prisma cuid, not an AAD object id)
  // makes Graph reject every create with 404/403. Treat it as mandatory.
  return Boolean(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_ORGANIZER_ID
  )
}

/** Client-credentials grant against the tenant's Graph token endpoint. */
async function getAccessToken(): Promise<string> {
  return getCachedToken("teams", async () => {
    const res = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(
        process.env.AZURE_TENANT_ID ?? ""
      )}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID ?? "",
          client_secret: process.env.AZURE_CLIENT_SECRET ?? "",
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    )
    if (!res.ok) {
      throw new Error(`Azure OAuth token exchange failed (${res.status})`)
    }
    const json = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!json.access_token) {
      throw new Error("Azure OAuth returned no access_token")
    }
    return { token: json.access_token, expiresInSec: json.expires_in ?? 3600 }
  })
}

export const teamsAdapter: ConferenceProviderAdapter = {
  id: "teams",
  isConfigured: configured,

  async createMeeting(input: CreateMeetingInput): Promise<MeetingResult> {
    if (!configured()) throw new ProviderNotConfiguredError("teams")
    const token = await getAccessToken()

    // App-only Graph requires an explicit organizer (no `/me`). Prefer a
    // configured AAD object id; fall back to the app userId mapping.
    const organizer = process.env.AZURE_ORGANIZER_ID || input.hostUserId
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        organizer
      )}/onlineMeetings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDateTime: input.scheduledStart.toISOString(),
          endDateTime: input.scheduledEnd.toISOString(),
          subject: input.title,
        }),
      }
    )
    if (!res.ok) {
      throw new Error(`Teams onlineMeeting create failed (${res.status})`)
    }
    const json = (await res.json()) as { id?: string; joinWebUrl?: string }
    if (!json.joinWebUrl) throw new Error("Teams returned no joinWebUrl")
    return {
      provider: "teams",
      externalId: json.id ?? "",
      joinUrl: json.joinWebUrl,
    }
  },

  async getRecording() {
    throw new ProviderNotImplementedError("teams", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("teams", "getAttendance")
  },
}
