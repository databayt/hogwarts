// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The outbox against an in-memory stand-in for IndexedDB. What matters:
 * nothing is dropped, ids are stable across retries, coalescing keeps only
 * the newest sample, rejections park with their reason, and a dead network
 * backs off instead of spinning.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { OutboxItem } from "@/lib/offline/db"
import {
  drainOutbox,
  enqueue,
  isRetryableCode,
  listOutbox,
  MAX_ATTEMPTS,
  nextDelayMs,
  outboxCounts,
  retryOutboxItem,
} from "@/lib/offline/outbox"

const store = new Map<string, OutboxItem>()

vi.mock("@/lib/offline/db", () => ({
  STORES: {
    lessons: "lessons",
    assets: "assets",
    chunks: "chunks",
    outbox: "outbox",
  },
  hasIndexedDb: () => true,
  idbGet: async (_s: string, key: string) => store.get(key),
  idbGetAll: async () => [...store.values()],
  idbGetAllByIndex: async (_s: string, index: string, value: string) =>
    [...store.values()].filter(
      (i) => (i as unknown as Record<string, unknown>)[index] === value
    ),
  idbPut: async (_s: string, v: OutboxItem) => {
    store.set(v.id, v)
  },
  idbDelete: async (_s: string, key: string) => {
    store.delete(key)
  },
}))

const fetchMock = vi.fn()

function respond(
  results: Array<{ id: string; result: string; code?: string; data?: unknown }>
) {
  return { ok: true, status: 200, json: async () => ({ results }) }
}

beforeEach(() => {
  store.clear()
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  vi.stubGlobal("navigator", { onLine: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("backoff", () => {
  it("doubles from 1s and caps at 60s", () => {
    expect(nextDelayMs(0)).toBe(1000)
    expect(nextDelayMs(1)).toBe(2000)
    expect(nextDelayMs(3)).toBe(8000)
    expect(nextDelayMs(10)).toBe(60_000)
  })

  it("retries only transport/server errors, never a verdict about the work", () => {
    expect(isRetryableCode("ERROR")).toBe(true)
    expect(isRetryableCode(undefined)).toBe(true)
    expect(isRetryableCode("NO_ENROLLMENT")).toBe(false)
    expect(isRetryableCode("ALREADY_GRADED")).toBe(false)
  })
})

describe("enqueue", () => {
  it("mints a stable id and keeps the item pending", async () => {
    const item = await enqueue({
      kind: "complete",
      payload: { lessonId: "l1" },
    })
    expect(item.id).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(item.state).toBe("pending")
    expect(await outboxCounts()).toEqual({ pending: 1, parked: 0 })
  })

  it("keeps the caller's id when given one (a quiz attempt)", async () => {
    const item = await enqueue({
      kind: "quiz",
      id: "attempt-000001",
      payload: {},
    })
    expect(item.id).toBe("attempt-000001")
  })

  it("coalesces playback positions: the newest sample replaces older pending ones", async () => {
    await enqueue({
      kind: "progress",
      coalesceKey: "progress:l1",
      payload: { watchedSeconds: 10 },
    })
    await enqueue({
      kind: "progress",
      coalesceKey: "progress:l1",
      payload: { watchedSeconds: 20 },
    })
    await enqueue({
      kind: "progress",
      coalesceKey: "progress:l2",
      payload: { watchedSeconds: 5 },
    })
    const items = await listOutbox()
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.coalesceKey === "progress:l1")?.payload).toEqual(
      { watchedSeconds: 20 }
    )
  })
})

describe("drainOutbox", () => {
  it("posts due items in creation order and removes applied/duplicate ones", async () => {
    const a = await enqueue({ kind: "progress", payload: { n: 1 } })
    const b = await enqueue({ kind: "complete", payload: { n: 2 } })
    fetchMock.mockResolvedValueOnce(
      respond([
        { id: a.id, result: "applied" },
        { id: b.id, result: "duplicate" },
      ])
    )
    const summary = await drainOutbox()
    expect(summary).toMatchObject({
      applied: 1,
      duplicate: 1,
      parked: 0,
      deferred: 0,
    })
    expect(await listOutbox()).toHaveLength(0)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.items.map((i: { id: string }) => i.id)).toEqual([a.id, b.id])
    expect(body.items[0]).toEqual({
      id: a.id,
      kind: "progress",
      payload: { n: 1 },
      createdAt: a.createdAt,
    })
  })

  it("parks a rejected item with the server's code — visible, never dropped", async () => {
    const a = await enqueue({ kind: "quiz", payload: {} })
    fetchMock.mockResolvedValueOnce(
      respond([{ id: a.id, result: "rejected", code: "NO_ENROLLMENT" }])
    )
    const summary = await drainOutbox()
    expect(summary.parked).toBe(1)
    const [item] = await listOutbox()
    expect(item).toMatchObject({
      id: a.id,
      state: "parked",
      code: "NO_ENROLLMENT",
    })
    expect(await outboxCounts()).toEqual({ pending: 0, parked: 1 })
  })

  it("hands back the server's data for a graded quiz", async () => {
    const a = await enqueue({ kind: "quiz", id: "attempt-000001", payload: {} })
    fetchMock.mockResolvedValueOnce(
      respond([{ id: a.id, result: "applied", data: { score: 3, total: 4 } }])
    )
    const summary = await drainOutbox()
    expect(summary.data["attempt-000001"]).toEqual({ score: 3, total: 4 })
  })

  it("backs off the whole batch when the network fails, keeping every item", async () => {
    const a = await enqueue({ kind: "progress", payload: {} })
    fetchMock.mockRejectedValueOnce(new Error("offline"))
    const before = Date.now()
    const summary = await drainOutbox()
    expect(summary.deferred).toBe(1)
    const [item] = await listOutbox()
    expect(item.id).toBe(a.id)
    expect(item.attempts).toBe(1)
    expect(item.nextAt).toBeGreaterThanOrEqual(before + 2000)
    // not due yet → a second drain sends nothing
    await drainOutbox()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("gives up into a parked item after MAX_ATTEMPTS transport failures", async () => {
    const a = await enqueue({ kind: "progress", payload: {} })
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      store.set(a.id, { ...store.get(a.id)!, nextAt: 0 })
      fetchMock.mockRejectedValueOnce(new Error("offline"))
      await drainOutbox()
    }
    const [item] = await listOutbox()
    expect(item.state).toBe("parked")
    expect(item.code).toBe("GAVE_UP")
  })

  it("leaves everything untouched when signed out (401)", async () => {
    await enqueue({ kind: "progress", payload: {} })
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    })
    const summary = await drainOutbox()
    expect(summary.deferred).toBe(1)
    const [item] = await listOutbox()
    expect(item.attempts).toBe(0)
    expect(item.state).toBe("pending")
  })

  it("does nothing while the device reports offline", async () => {
    await enqueue({ kind: "progress", payload: {} })
    vi.stubGlobal("navigator", { onLine: false })
    await drainOutbox()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("retryOutboxItem re-queues a parked item from zero", async () => {
    const a = await enqueue({ kind: "quiz", payload: {} })
    fetchMock.mockResolvedValueOnce(
      respond([{ id: a.id, result: "rejected", code: "NO_QUESTIONS" }])
    )
    await drainOutbox()
    await retryOutboxItem(a.id)
    const [item] = await listOutbox()
    expect(item).toMatchObject({ state: "pending", attempts: 0, nextAt: 0 })
    expect(item.code).toBeUndefined()
  })
})
