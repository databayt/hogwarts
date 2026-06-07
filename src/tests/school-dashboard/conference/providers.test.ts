// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Provider-adapter registry + native createMeeting flows. External is
// functional; the native providers (Meet/Zoom/Teams) do real OAuth + API calls
// when configured (verified here against mocked fetch) and throw
// NotConfigured/NotImplemented otherwise.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ProviderNotConfiguredError,
  ProviderNotImplementedError,
  configuredProviderIds,
  getProviderAdapter,
  listProviderAdapters,
} from "@/components/school-dashboard/conference/providers"

const NATIVE_ENV = [
  "GOOGLE_MEET_CLIENT_ID",
  "GOOGLE_MEET_CLIENT_SECRET",
  "GOOGLE_MEET_REFRESH_TOKEN",
  "ZOOM_ACCOUNT_ID",
  "ZOOM_CLIENT_ID",
  "ZOOM_CLIENT_SECRET",
  "AZURE_TENANT_ID",
  "AZURE_CLIENT_ID",
  "AZURE_CLIENT_SECRET",
  "AZURE_ORGANIZER_ID",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of NATIVE_ENV) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})
afterEach(() => {
  vi.unstubAllGlobals()
  for (const k of NATIVE_ENV) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

const INPUT = {
  schoolId: "s-1",
  title: "Algebra",
  scheduledStart: new Date("2026-01-01T10:00:00.000Z"),
  scheduledEnd: new Date("2026-01-01T11:00:00.000Z"),
  hostUserId: "u-1",
}

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

describe("provider registry", () => {
  it("resolves each id + exposes four adapters", () => {
    expect(listProviderAdapters()).toHaveLength(4)
    for (const id of ["external", "google_meet", "zoom", "teams"] as const) {
      expect(getProviderAdapter(id).id).toBe(id)
    }
  })

  it("only external is configured with no native creds set", () => {
    expect(configuredProviderIds()).toEqual(["external"])
  })

  it("google_meet becomes configured once its env is present", () => {
    process.env.GOOGLE_MEET_CLIENT_ID = "id"
    process.env.GOOGLE_MEET_CLIENT_SECRET = "secret"
    process.env.GOOGLE_MEET_REFRESH_TOKEN = "rtok"
    expect(getProviderAdapter("google_meet").isConfigured()).toBe(true)
    expect(configuredProviderIds()).toEqual(
      expect.arrayContaining(["external", "google_meet"])
    )
  })
})

describe("external adapter (functional)", () => {
  it("wraps a user-supplied URL; no recording/attendance signal", async () => {
    const a = getProviderAdapter("external")
    const r = await a.createMeeting({
      ...INPUT,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    })
    expect(r.joinUrl).toBe("https://meet.google.com/abc-defg-hij")
    expect(await a.getRecording("")).toBeNull()
    expect(await a.getAttendance("")).toEqual([])
  })

  it("throws when no URL is supplied", async () => {
    await expect(
      getProviderAdapter("external").createMeeting(INPUT)
    ).rejects.toThrow()
  })
})

describe("native providers — guarded when not configured", () => {
  for (const id of ["google_meet", "zoom", "teams"] as const) {
    it(`${id}.createMeeting without creds → ProviderNotConfiguredError`, async () => {
      await expect(
        getProviderAdapter(id).createMeeting(INPUT)
      ).rejects.toBeInstanceOf(ProviderNotConfiguredError)
    })
    it(`${id}.getRecording → ProviderNotImplementedError`, async () => {
      await expect(
        getProviderAdapter(id).getRecording("x")
      ).rejects.toBeInstanceOf(ProviderNotImplementedError)
    })
  }
})

describe("native createMeeting against mocked APIs", () => {
  it("google_meet: refresh-token grant → Calendar event with a Meet link", async () => {
    process.env.GOOGLE_MEET_CLIENT_ID = "cid"
    process.env.GOOGLE_MEET_CLIENT_SECRET = "csec"
    process.env.GOOGLE_MEET_REFRESH_TOKEN = "rtok"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "AT" }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "evt-1",
          conferenceData: {
            entryPoints: [
              { entryPointType: "video", uri: "https://meet.google.com/xyz" },
            ],
          },
        })
      )
    vi.stubGlobal("fetch", fetchMock)

    const r = await getProviderAdapter("google_meet").createMeeting(INPUT)

    expect(r).toEqual({
      provider: "google_meet",
      externalId: "evt-1",
      joinUrl: "https://meet.google.com/xyz",
    })
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "oauth2.googleapis.com/token"
    )
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "calendar/v3/calendars/primary/events"
    )
  })

  it("zoom: account-credentials OAuth → meeting with a join_url", async () => {
    process.env.ZOOM_ACCOUNT_ID = "acc"
    process.env.ZOOM_CLIENT_ID = "cid"
    process.env.ZOOM_CLIENT_SECRET = "csec"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "AT" }))
      .mockResolvedValueOnce(
        jsonResponse({ id: 98765, join_url: "https://zoom.us/j/98765" })
      )
    vi.stubGlobal("fetch", fetchMock)

    const r = await getProviderAdapter("zoom").createMeeting(INPUT)

    expect(r).toEqual({
      provider: "zoom",
      externalId: "98765",
      joinUrl: "https://zoom.us/j/98765",
    })
    expect(String(fetchMock.mock.calls[0][0])).toContain("zoom.us/oauth/token")
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "api.zoom.us/v2/users/me/meetings"
    )
  })

  it("teams: client-credentials OAuth → onlineMeeting for the organizer", async () => {
    process.env.AZURE_TENANT_ID = "tid"
    process.env.AZURE_CLIENT_ID = "cid"
    process.env.AZURE_CLIENT_SECRET = "csec"
    process.env.AZURE_ORGANIZER_ID = "org-1"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "AT" }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "mtg-1",
          joinWebUrl: "https://teams.microsoft.com/l/xyz",
        })
      )
    vi.stubGlobal("fetch", fetchMock)

    const r = await getProviderAdapter("teams").createMeeting(INPUT)

    expect(r).toEqual({
      provider: "teams",
      externalId: "mtg-1",
      joinUrl: "https://teams.microsoft.com/l/xyz",
    })
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "graph.microsoft.com/v1.0/users/org-1/onlineMeetings"
    )
  })
})
