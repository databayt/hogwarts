// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  hasIndexedDb,
  idbDelete,
  idbGet,
  idbGetAll,
  idbGetAllByIndex,
  idbPut,
  STORES,
  type OutboxItem,
  type OutboxKind,
} from "./db"

/**
 * The outbox: work done with no connection, replayed to `POST /api/offline/sync`
 * when one comes back.
 *
 * Rules the student is relying on, whether they know it or not:
 *  - Nothing is ever silently dropped. An item either lands (applied or
 *    recognised as a duplicate) or is PARKED with the server's reason, where
 *    the UI can show it.
 *  - Ids are minted here, once, so a retry after a lost response is the same
 *    item to the server.
 *  - Failures back off exponentially; a dead network never becomes a tight
 *    loop on a phone battery.
 */

export const SYNC_ENDPOINT = "/api/offline/sync"
export const SYNC_BATCH_SIZE = 50
export const MAX_ATTEMPTS = 8
export const BACKOFF_BASE_MS = 1000
export const BACKOFF_CAP_MS = 60_000

/** Rejection codes worth retrying — everything else is a fact about the work, not the network. */
const RETRYABLE_CODES = new Set(["ERROR"])

export interface OutboxCounts {
  pending: number
  parked: number
}

export interface DrainSummary {
  applied: number
  duplicate: number
  parked: number
  deferred: number
  /** The server's data for applied/duplicate items (a graded quiz), by id. */
  data: Record<string, unknown>
}

/** 1s, 2s, 4s … capped at 60s. Pure, for the tests. */
export function nextDelayMs(attempts: number): number {
  return Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts))
}

export function isRetryableCode(code: string | undefined): boolean {
  return code === undefined || RETRYABLE_CODES.has(code)
}

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }
  return `ob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

type Listener = (counts: OutboxCounts) => void
const listeners = new Set<Listener>()

export function subscribeOutbox(listener: Listener): () => void {
  listeners.add(listener)
  void outboxCounts()
    .then(listener)
    .catch(() => {})
  return () => {
    listeners.delete(listener)
  }
}

async function notify(): Promise<void> {
  if (listeners.size === 0) return
  try {
    const counts = await outboxCounts()
    listeners.forEach((l) => l(counts))
  } catch {
    // counting failed — the next change will try again
  }
}

export async function outboxCounts(): Promise<OutboxCounts> {
  if (!hasIndexedDb()) return { pending: 0, parked: 0 }
  const items = await idbGetAll<OutboxItem>(STORES.outbox)
  let pending = 0
  let parked = 0
  for (const i of items) {
    if (i.state === "parked") parked++
    else pending++
  }
  return { pending, parked }
}

export async function listOutbox(): Promise<OutboxItem[]> {
  if (!hasIndexedDb()) return []
  const items = await idbGetAll<OutboxItem>(STORES.outbox)
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * Queue a piece of work. `coalesceKey` lets a stream of playback positions
 * collapse to the newest one: the server would apply them all in order
 * anyway, but forty samples of the same lesson are forty rows to sync for
 * one fact.
 */
export async function enqueue(input: {
  kind: OutboxKind
  payload: unknown
  id?: string
  coalesceKey?: string
}): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: input.id ?? newId(),
    kind: input.kind,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    coalesceKey: input.coalesceKey,
    attempts: 0,
    nextAt: 0,
    state: "pending",
  }
  if (input.coalesceKey) {
    const older = await idbGetAllByIndex<OutboxItem>(
      STORES.outbox,
      "coalesceKey",
      input.coalesceKey
    )
    for (const o of older) {
      if (o.state === "pending" && o.id !== item.id) {
        await idbDelete(STORES.outbox, o.id)
      }
    }
  }
  await idbPut(STORES.outbox, item)
  await notify()
  return item
}

export async function discardOutboxItem(id: string): Promise<void> {
  await idbDelete(STORES.outbox, id)
  await notify()
}

/** Put a parked item back in the queue — after the student fixed what the server objected to. */
export async function retryOutboxItem(id: string): Promise<void> {
  const item = await idbGet<OutboxItem>(STORES.outbox, id)
  if (!item) return
  await idbPut(STORES.outbox, {
    ...item,
    state: "pending",
    attempts: 0,
    nextAt: 0,
    code: undefined,
    lastError: undefined,
  })
  await notify()
}

let draining: Promise<DrainSummary> | null = null

/**
 * Replay everything that is due. Single-flight per tab; two tabs draining at
 * once are harmless because every kind is idempotent server-side.
 */
export function drainOutbox(): Promise<DrainSummary> {
  if (draining) return draining
  draining = doDrain().finally(() => {
    draining = null
  })
  return draining
}

async function doDrain(): Promise<DrainSummary> {
  const summary: DrainSummary = {
    applied: 0,
    duplicate: 0,
    parked: 0,
    deferred: 0,
    data: {},
  }
  if (!hasIndexedDb()) return summary
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return summary

  const now = Date.now()
  const due = (await listOutbox()).filter(
    (i) => i.state === "pending" && i.nextAt <= now
  )
  if (due.length === 0) return summary

  for (let i = 0; i < due.length; i += SYNC_BATCH_SIZE) {
    const batch = due.slice(i, i + SYNC_BATCH_SIZE)
    let verdicts: Array<{
      id: string
      result: string
      code?: string
      data?: unknown
    }>
    try {
      const res = await fetch(SYNC_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: batch.map(({ id, kind, payload, createdAt }) => ({
            id,
            kind,
            payload,
            createdAt,
          })),
        }),
      })
      if (res.status === 401) {
        // Signed out: nothing to do until the student signs in again. Leave
        // every item exactly where it is.
        summary.deferred += batch.length
        break
      }
      if (!res.ok) throw new Error(`sync ${res.status}`)
      verdicts = (await res.json()).results
    } catch (err) {
      // Whole batch: network or server trouble, not a fact about any item.
      for (const item of batch) {
        await defer(item, err instanceof Error ? err.message : String(err))
      }
      summary.deferred += batch.length
      continue
    }

    const byId = new Map(verdicts.map((v) => [v.id, v]))
    for (const item of batch) {
      const v = byId.get(item.id)
      if (!v) {
        await defer(item, "no verdict")
        summary.deferred++
        continue
      }
      if (v.result === "applied" || v.result === "duplicate") {
        await idbDelete(STORES.outbox, item.id)
        if (v.data !== undefined) summary.data[item.id] = v.data
        if (v.result === "applied") summary.applied++
        else summary.duplicate++
      } else if (isRetryableCode(v.code) && item.attempts + 1 < MAX_ATTEMPTS) {
        await defer(item, v.code ?? "rejected")
        summary.deferred++
      } else {
        await idbPut(STORES.outbox, {
          ...item,
          state: "parked",
          code: v.code ?? "REJECTED",
          lastError: v.code ?? "rejected",
        })
        summary.parked++
      }
    }
  }

  await notify()
  return summary
}

async function defer(item: OutboxItem, error: string): Promise<void> {
  const attempts = item.attempts + 1
  if (attempts >= MAX_ATTEMPTS) {
    await idbPut(STORES.outbox, {
      ...item,
      attempts,
      state: "parked",
      code: "GAVE_UP",
      lastError: error,
    })
    return
  }
  await idbPut(STORES.outbox, {
    ...item,
    attempts,
    nextAt: Date.now() + nextDelayMs(attempts),
    lastError: error,
  })
}

let triggersInstalled = false

/**
 * Wire the moments a drain is worth attempting: the connection coming back,
 * the tab becoming visible, the service worker's background-sync nudge.
 * Idempotent — the provider calls it once per page.
 */
export function installOutboxTriggers(): () => void {
  if (triggersInstalled || typeof window === "undefined") return () => {}
  triggersInstalled = true

  const onOnline = () => void drainOutbox()
  const onVisible = () => {
    if (document.visibilityState === "visible") void drainOutbox()
  }
  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === "drain-outbox") void drainOutbox()
  }

  window.addEventListener("online", onOnline)
  document.addEventListener("visibilitychange", onVisible)
  navigator.serviceWorker?.addEventListener("message", onMessage)

  // Anything left from a previous session.
  void drainOutbox()

  return () => {
    triggersInstalled = false
    window.removeEventListener("online", onOnline)
    document.removeEventListener("visibilitychange", onVisible)
    navigator.serviceWorker?.removeEventListener("message", onMessage)
  }
}
