// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Wave-4 scaffold: the provider-adapter registry. External is functional; the
// native providers are stubs that throw NotImplemented + report isConfigured
// from env.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ProviderNotImplementedError,
  configuredProviderIds,
  getProviderAdapter,
  listProviderAdapters,
} from "../providers"

const NATIVE_ENV = [
  "GOOGLE_MEET_CLIENT_ID",
  "GOOGLE_MEET_CLIENT_SECRET",
  "ZOOM_ACCOUNT_ID",
  "ZOOM_CLIENT_ID",
  "ZOOM_CLIENT_SECRET",
  "AZURE_TENANT_ID",
  "AZURE_CLIENT_ID",
  "AZURE_CLIENT_SECRET",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of NATIVE_ENV) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})
afterEach(() => {
  for (const k of NATIVE_ENV) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

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
      schoolId: "s",
      title: "t",
      scheduledStart: new Date(0),
      scheduledEnd: new Date(1),
      hostUserId: "u",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    })
    expect(r.joinUrl).toBe("https://meet.google.com/abc-defg-hij")
    expect(await a.getRecording("")).toBeNull()
    expect(await a.getAttendance("")).toEqual([])
  })

  it("throws when no URL is supplied", async () => {
    await expect(
      getProviderAdapter("external").createMeeting({
        schoolId: "s",
        title: "t",
        scheduledStart: new Date(0),
        scheduledEnd: new Date(1),
        hostUserId: "u",
      })
    ).rejects.toThrow()
  })
})

describe("native stubs throw NotImplemented", () => {
  for (const id of ["google_meet", "zoom", "teams"] as const) {
    it(`${id}.createMeeting → ProviderNotImplementedError`, async () => {
      await expect(
        getProviderAdapter(id).createMeeting({
          schoolId: "s",
          title: "t",
          scheduledStart: new Date(0),
          scheduledEnd: new Date(1),
          hostUserId: "u",
        })
      ).rejects.toBeInstanceOf(ProviderNotImplementedError)
    })
  }
})
