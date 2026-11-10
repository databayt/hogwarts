// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The room's connection trace: what is kept, what is dropped, and that events
 * wait for a page able to send them. The 2026-11-10 noon class is the reason
 * it exists — the video server saw phones go quiet 20 to 90 seconds after
 * joining and could not say whether they slept or lost the network.
 */

import { describe, expect, it, vi } from "vitest"

import {
  createTraceRecorder,
  MAX_FLUSHES,
  MAX_TOTAL_EVENTS,
  MAX_TRACE_EVENTS,
  noteTrace,
  onTraceNote,
  sanitizeTrace,
  type TraceEvent,
} from "@/components/school-dashboard/live/room/connection-trace"

const NOW = 1_794_300_000_000

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  }
}

function recorder(over: Partial<Parameters<typeof createTraceRecorder>[0]> = {}) {
  const sent: TraceEvent[][] = []
  const deps = {
    now: () => NOW,
    send: vi.fn(async (events: TraceEvent[]) => {
      sent.push(events)
      return true
    }),
    canSend: () => true,
    storage: memoryStorage(),
    storageKey: "live-trace:s1",
    ...over,
  }
  return { r: createTraceRecorder(deps), sent, deps }
}

describe("sanitizeTrace", () => {
  it("keeps well-formed events and their fields", () => {
    expect(
      sanitizeTrace(
        [
          { t: NOW, k: "hidden" },
          { t: NOW + 4_000, k: "visible", ms: 4_000.4 },
          { t: NOW + 5_000, k: "disconnected", d: "CLIENT_INITIATED" },
        ],
        NOW
      )
    ).toEqual([
      { t: NOW, k: "hidden" },
      { t: NOW + 4_000, k: "visible", ms: 4_000 },
      { t: NOW + 5_000, k: "disconnected", d: "CLIENT_INITIATED" },
    ])
  })

  it("drops what it does not know", () => {
    expect(
      sanitizeTrace(
        [
          { t: NOW, k: "made_up" },
          { t: "now", k: "hidden" },
          { t: NOW - 400 * 24 * 60 * 60 * 1000, k: "hidden" },
          null,
          "hidden",
          { k: "hidden" },
        ],
        NOW
      )
    ).toEqual([])
    expect(sanitizeTrace("hidden", NOW)).toEqual([])
    expect(sanitizeTrace(undefined, NOW)).toEqual([])
  })

  it("bounds the numbers and cleans the detail", () => {
    const [e] = sanitizeTrace(
      [
        {
          t: NOW,
          k: "net",
          ms: 9e12,
          d: `cellular/3g<script>${"x".repeat(200)}`,
        },
      ],
      NOW
    )
    expect(e.ms).toBe(24 * 60 * 60 * 1000)
    expect(e.d).toMatch(/^cellular\/3gscriptx+$/)
    expect(e.d!.length).toBe(60)
    expect(sanitizeTrace([{ t: NOW, k: "stall", ms: -5 }], NOW)).toEqual([
      { t: NOW, k: "stall" },
    ])
  })

  it("takes one write's worth and no more", () => {
    const many = Array.from({ length: MAX_TRACE_EVENTS + 25 }, () => ({
      t: NOW,
      k: "quality",
      d: "poor",
    }))
    expect(sanitizeTrace(many, NOW)).toHaveLength(MAX_TRACE_EVENTS)
  })
})

describe("createTraceRecorder", () => {
  it("sends what is waiting, once", async () => {
    const { r, sent } = recorder()
    r.note("join", { d: "visible;wifi/4g;wake=yes" })
    r.note("hidden")
    await r.flush()
    expect(sent).toEqual([
      [
        { t: NOW, k: "join", d: "visible;wifi/4g;wake=yes" },
        { t: NOW, k: "hidden" },
      ],
    ])
    expect(r.pending()).toBe(0)
    await r.flush()
    expect(sent).toHaveLength(1)
  })

  it("holds events while the page cannot send, then sends them", async () => {
    let able = false
    const { r, sent } = recorder({ canSend: () => able })
    r.note("hidden")
    await r.flush()
    expect(sent).toHaveLength(0)
    expect(r.pending()).toBe(1)
    able = true
    r.note("visible", { ms: 61_000 })
    await r.flush()
    expect(sent[0].map((e) => e.k)).toEqual(["hidden", "visible"])
  })

  it("puts a refused batch back, in order", async () => {
    const send = vi
      .fn<(e: TraceEvent[]) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(true)
    const { r } = recorder({ send })
    r.note("hidden")
    await r.flush()
    r.note("visible")
    await r.flush()
    expect(r.pending()).toBe(2)
    await r.flush()
    expect(send.mock.calls[2][0].map((e) => e.k)).toEqual(["hidden", "visible"])
    expect(r.pending()).toBe(0)
  })

  it("stops asking a server that keeps refusing", async () => {
    const send = vi.fn(async () => false)
    const { r } = recorder({ send })
    r.note("hidden")
    for (let i = 0; i < MAX_FLUSHES + 10; i++) await r.flush()
    expect(send).toHaveBeenCalledTimes(MAX_FLUSHES)
  })

  it("keeps a bounded number of events per page", () => {
    const { r } = recorder({ canSend: () => false })
    for (let i = 0; i < MAX_TOTAL_EVENTS + 50; i++) r.note("quality")
    expect(r.pending()).toBe(MAX_TOTAL_EVENTS)
  })

  it("carries what the last page of this tab never sent", async () => {
    const storage = memoryStorage({
      "live-trace:s1": JSON.stringify([
        { t: NOW - 90_000, k: "hidden" },
        { t: NOW - 80_000, k: "bogus" },
      ]),
    })
    const { r, sent } = recorder({ storage })
    r.note("join")
    await r.flush()
    expect(sent[0].map((e) => e.k)).toEqual(["hidden", "join"])
    // Sent means gone from the tab's storage too.
    expect(storage.map.has("live-trace:s1")).toBe(false)
  })

  it("does not hand a batch in flight to the next page of the tab", async () => {
    const storage = memoryStorage()
    let release: (ok: boolean) => void = () => {}
    const slow = vi.fn(
      () => new Promise<boolean>((resolve) => void (release = resolve))
    )
    const first = recorder({ storage, send: slow })
    first.r.note("join")
    const inFlight = first.r.flush()
    // The room remounts while the first write has not come back.
    const second = recorder({ storage })
    second.r.note("join")
    await second.r.flush()
    expect(second.sent[0].map((e) => e.k)).toEqual(["join"])
    release(true)
    await inFlight
    expect(first.r.pending()).toBe(0)
  })

  it("survives a storage that throws", async () => {
    const storage = {
      getItem: () => {
        throw new Error("denied")
      },
      setItem: () => {
        throw new Error("full")
      },
      removeItem: () => {
        throw new Error("denied")
      },
    }
    const { r, sent } = recorder({ storage })
    r.note("join")
    await r.flush()
    expect(sent).toHaveLength(1)
  })
})

describe("noteTrace", () => {
  it("reaches a listener until it lets go, and never throws", () => {
    const seen: string[] = []
    const off = onTraceNote((k, d) => seen.push(`${k}:${d ?? ""}`))
    const offBad = onTraceNote(() => {
      throw new Error("listener bug")
    })
    expect(() => noteTrace("wake", "on")).not.toThrow()
    off()
    offBad()
    noteTrace("wake", "released")
    expect(seen).toEqual(["wake:on"])
  })
})
