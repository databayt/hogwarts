// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The hook that feeds the trace: page and room events in, batches out, and a
 * clean exit. It renders nothing, so the test drives a fake room emitter.
 */

import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { recordConnectionTrace } from "@/components/school-dashboard/live/actions/connection-trace"
import { noteTrace } from "@/components/school-dashboard/live/room/connection-trace"

type Handler = (...args: unknown[]) => void
const handlers = new Map<string, Set<Handler>>()
const fakeRoom = {
  on: (event: string, fn: Handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(fn)
  },
  off: (event: string, fn: Handler) => {
    handlers.get(event)?.delete(fn)
  },
}
const emit = (event: string, ...args: unknown[]) => {
  for (const fn of handlers.get(event) ?? []) fn(...args)
}

vi.mock("@livekit/components-react", () => ({
  useRoomContext: () => fakeRoom,
}))
vi.mock("@/components/school-dashboard/live/actions/connection-trace", () => ({
  recordConnectionTrace: vi.fn(async () => ({
    success: true,
    data: { stored: true },
  })),
}))

const { useConnectionTrace } =
  await import("@/components/school-dashboard/live/room/use-connection-trace")
const { DisconnectReason, RoomEvent } = await import("livekit-client")

const mSend = recordConnectionTrace as unknown as ReturnType<typeof vi.fn>
const kinds = (call = 0) =>
  (mSend.mock.calls[call][0].events as Array<{ k: string }>).map((e) => e.k)
const sentEvents = () =>
  mSend.mock.calls.flatMap(
    (c) => c[0].events as Array<{ k: string; ms?: number; d?: string }>
  )

let visibility: "visible" | "hidden" = "visible"
function setVisibility(v: "visible" | "hidden") {
  visibility = v
  document.dispatchEvent(new Event("visibilitychange"))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  handlers.clear()
  visibility = "visible"
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibility,
  })
  window.sessionStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("useConnectionTrace", () => {
  it("sends the join shortly after the room mounts", async () => {
    renderHook(() => useConnectionTrace("s1"))
    expect(mSend).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(8_000)
    expect(mSend).toHaveBeenCalledTimes(1)
    expect(mSend.mock.calls[0][0].sessionId).toBe("s1")
    expect(kinds()).toEqual(["join"])
    expect(mSend.mock.calls[0][0].events[0].d).toMatch(/^visible;/)
  })

  it("holds a hidden page's events and sends them when it is back", async () => {
    renderHook(() => useConnectionTrace("s1"))
    await vi.advanceTimersByTimeAsync(8_000)
    setVisibility("hidden")
    emit(RoomEvent.Reconnecting)
    // A hidden page sends nothing, however long it waits.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mSend).toHaveBeenCalledTimes(1)
    setVisibility("visible")
    emit(RoomEvent.Reconnected)
    await vi.advanceTimersByTimeAsync(2_000)
    const all = sentEvents()
    expect(all.map((e) => e.k)).toEqual([
      "join",
      "hidden",
      "reconnecting",
      "visible",
      "reconnected",
    ])
    expect(all[2].d).toBe("hidden")
    expect(all[3].ms).toBe(60_000)
    expect(all[4].ms).toBe(60_000)
  })

  it("names why the room ended and sends it at once", async () => {
    renderHook(() => useConnectionTrace("s1"))
    await vi.advanceTimersByTimeAsync(8_000)
    emit(RoomEvent.Disconnected, DisconnectReason.DUPLICATE_IDENTITY)
    await vi.advanceTimersByTimeAsync(0)
    expect(sentEvents().at(-1)).toMatchObject({
      k: "disconnected",
      d: "DUPLICATE_IDENTITY",
    })
  })

  it("records this seat's quality, not other people's", async () => {
    renderHook(() => useConnectionTrace("s1"))
    emit(RoomEvent.ConnectionQualityChanged, "poor", { isLocal: false })
    emit(RoomEvent.ConnectionQualityChanged, "poor", { isLocal: true })
    emit(RoomEvent.SignalReconnecting)
    window.dispatchEvent(new Event("offline"))
    noteTrace("wake", "refused")
    await vi.advanceTimersByTimeAsync(8_000)
    const all = sentEvents()
    expect(all.map((e) => e.k)).toEqual([
      "join",
      "quality",
      "signal",
      "offline",
      "wake",
    ])
    expect(all[1].d).toBe("poor")
    expect(all[4].d).toBe("refused")
  })

  it("lets go of every listener when the room unmounts", async () => {
    const { unmount } = renderHook(() => useConnectionTrace("s1"))
    await vi.advanceTimersByTimeAsync(8_000)
    unmount()
    expect([...handlers.values()].every((set) => set.size === 0)).toBe(true)
    const before = mSend.mock.calls.length
    emit(RoomEvent.Reconnecting)
    setVisibility("hidden")
    noteTrace("wake", "on")
    await vi.advanceTimersByTimeAsync(120_000)
    expect(mSend.mock.calls.length).toBe(before)
  })

  it("never lets a failing write reach the room", async () => {
    mSend.mockRejectedValue(new Error("network"))
    renderHook(() => useConnectionTrace("s1"))
    await expect(vi.advanceTimersByTimeAsync(60_000)).resolves.not.toThrow()
  })
})
