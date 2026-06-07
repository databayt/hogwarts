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

import {
  type ConferenceProviderAdapter,
  type CreateMeetingInput,
  type MeetingResult,
  ProviderNotConfiguredError,
  ProviderNotImplementedError,
} from "./types"

function configured(): boolean {
  return Boolean(
    process.env.AZURE_TENANT_ID &&
      process.env.AZURE_CLIENT_ID &&
      process.env.AZURE_CLIENT_SECRET
  )
}

/** Client-credentials grant against the tenant's Graph token endpoint. */
async function getAccessToken(): Promise<string> {
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
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) {
    throw new Error("Azure OAuth returned no access_token")
  }
  return json.access_token
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
    return { provider: "teams", externalId: json.id ?? "", joinUrl: json.joinWebUrl }
  },

  async getRecording() {
    throw new ProviderNotImplementedError("teams", "getRecording")
  },
  async getAttendance() {
    throw new ProviderNotImplementedError("teams", "getAttendance")
  },
}
