// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ctor = vi.hoisted(() => ({
  room: vi.fn(),
  egress: vi.fn(),
  listRooms: vi.fn(),
}))

vi.mock("livekit-server-sdk", () => ({
  RoomServiceClient: class {
    constructor(...args: unknown[]) {
      ctor.room(...args)
    }
    listRooms = ctor.listRooms
  },
  EgressClient: class {
    constructor(...args: unknown[]) {
      ctor.egress(...args)
    }
  },
}))

const ENV = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
] as const
const saved: Record<string, string | undefined> = {}

async function load() {
  vi.resetModules()
  return import("@/components/school-dashboard/live/livekit/client")
}

beforeEach(() => {
  for (const k of ENV) saved[k] = process.env[k]
  process.env.LIVEKIT_HOST = "https://lk.test"
  process.env.LIVEKIT_WS_URL = "wss://lk.test"
  process.env.LIVEKIT_API_KEY = "key"
  process.env.LIVEKIT_API_SECRET = "secret-long-enough-for-hs256-signing"
  ctor.room.mockClear()
  ctor.egress.mockClear()
  ctor.listRooms.mockReset()
})
afterEach(() => {
  vi.useRealTimers()
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("SFU calls are bounded", () => {
  it("the room client gives up after 5 seconds, not the SDK's 60", async () => {
    const m = await load()
    m.getRoomServiceClient()
    expect(ctor.room).toHaveBeenCalledWith(
      "https://lk.test",
      "key",
      "secret-long-enough-for-hs256-signing",
      { requestTimeout: 5 }
    )
    expect(m.LIVEKIT_REQUEST_TIMEOUT_S).toBe(5)
  })

  it("the egress client is bounded too", async () => {
    const m = await load()
    m.getEgressClient()
    expect(ctor.egress.mock.calls[0]?.[3]).toEqual({ requestTimeout: 10 })
  })
})

describe("probeLiveKit", () => {
  it("answers ok with the room count", async () => {
    ctor.listRooms.mockResolvedValue([{}, {}])
    const m = await load()
    const r = await m.probeLiveKit()
    expect(r.ok).toBe(true)
    expect(r.rooms).toBe(2)
  })

  it("reports the SFU's error instead of throwing", async () => {
    ctor.listRooms.mockRejectedValue(new Error("401 invalid API key"))
    const m = await load()
    const r = await m.probeLiveKit()
    expect(r).toMatchObject({ ok: false, error: "401 invalid API key" })
  })

  it("stops waiting on a silent server", async () => {
    vi.useFakeTimers()
    ctor.listRooms.mockReturnValue(new Promise(() => {}))
    const m = await load()
    const pending = m.probeLiveKit(3000)
    await vi.advanceTimersByTimeAsync(3001)
    const r = await pending
    expect(r.ok).toBe(false)
    expect(r.error).toContain("3000")
  })

  it("is not ok, and does not throw, when the SFU is not configured", async () => {
    delete process.env.LIVEKIT_HOST
    const m = await load()
    const r = await m.probeLiveKit()
    expect(r.ok).toBe(false)
    expect(ctor.listRooms).not.toHaveBeenCalled()
  })
})
