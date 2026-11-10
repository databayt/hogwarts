// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What a seat's connection went through, as the DEVICE saw it.
 *
 * The video server knows that a phone went quiet; it cannot know why. A locked
 * screen, a switch to another app and a dead network all reach it as the same
 * `PEER_CONNECTION_DISCONNECTED`. The page can tell them apart: it knows when
 * it was hidden, when its timers stopped, when the browser said "offline".
 * This module is that record — a short list of small events, written to the
 * class's event log (`eventType: "client_trace"`) while the page is able to
 * send. It draws nothing and changes nothing in the room.
 *
 * Plain module on purpose: the server action validates with the same
 * `sanitizeTrace` the client's queue is built from.
 */

export const TRACE_KINDS = [
  /** The room mounted. Detail: visibility, network, wake-lock support. */
  "join",
  /** The page went to the background or the screen locked. */
  "hidden",
  /** The page is back. `ms` is how long it was away. */
  "visible",
  /** Timers stopped for `ms` — the browser was suspended. */
  "stall",
  "offline",
  "online",
  /** The network type changed (wifi, 4g, 3g…). */
  "net",
  /** The signal socket dropped; media may still be flowing. */
  "signal",
  /** The SDK is rebuilding the connection. Detail: visibility at that moment. */
  "reconnecting",
  /** Back. `ms` is how long the rebuild took. */
  "reconnected",
  /** The room ended for this seat. Detail: the SDK's reason. */
  "disconnected",
  /** This seat's connection quality changed. */
  "quality",
  /** The screen wake lock: on, refused, released. */
  "wake",
] as const

export type TraceKind = (typeof TRACE_KINDS)[number]

export type TraceEvent = {
  /** Epoch milliseconds on the device. */
  t: number
  k: TraceKind
  /** Milliseconds the event describes. */
  ms?: number
  /** One short word or pair: a reason, a quality, a network type. */
  d?: string
}

/** Events in one write. */
export const MAX_TRACE_EVENTS = 60
/** Events one page keeps, sent or not — a flapping link cannot fill the log. */
export const MAX_TOTAL_EVENTS = 240
/** Writes one page attempts, failures included. */
export const MAX_FLUSHES = 30
const MAX_DETAIL = 60
const DAY_MS = 24 * 60 * 60 * 1000

const KINDS = new Set<string>(TRACE_KINDS)

/**
 * Keep what is well-formed, drop the rest. Never throws: the input is a
 * client's, and one bad entry must not cost the others.
 */
export function sanitizeTrace(input: unknown, now = Date.now()): TraceEvent[] {
  if (!Array.isArray(input)) return []
  const out: TraceEvent[] = []
  for (const raw of input) {
    if (out.length >= MAX_TRACE_EVENTS) break
    if (!raw || typeof raw !== "object") continue
    const { t, k, ms, d } = raw as Record<string, unknown>
    if (typeof k !== "string" || !KINDS.has(k)) continue
    // A device clock may be wrong by hours; it is still not from another year.
    if (typeof t !== "number" || !Number.isFinite(t)) continue
    if (Math.abs(t - now) > 2 * DAY_MS) continue
    const event: TraceEvent = { t: Math.round(t), k: k as TraceKind }
    if (typeof ms === "number" && Number.isFinite(ms) && ms >= 0) {
      event.ms = Math.min(Math.round(ms), DAY_MS)
    }
    if (typeof d === "string" && d) {
      const clean = d.replace(/[^\w .:;=/+-]/g, "").slice(0, MAX_DETAIL)
      if (clean) event.d = clean
    }
    out.push(event)
  }
  return out
}

export interface TraceRecorderDeps {
  now: () => number
  /** Deliver one batch. Resolves true when the server took it. */
  send: (events: TraceEvent[]) => Promise<boolean>
  /** The page can reach the server right now — visible and online. */
  canSend: () => boolean
  /** Outlives a reload of this tab. Missing or throwing in a private window. */
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null
  storageKey: string
}

export interface TraceRecorder {
  note: (k: TraceKind, extra?: { ms?: number; d?: string }) => void
  /** Send what is waiting, if the page is able to. */
  flush: () => Promise<void>
  pending: () => number
}

/**
 * The queue behind the room's trace. Events wait here until the page can send
 * them — a hidden or offline page sends nothing, which is exactly when the
 * interesting events happen — and are kept in the tab's session storage, so a
 * page that was killed in the background still tells its story when the tab
 * loads again.
 */
export function createTraceRecorder(deps: TraceRecorderDeps): TraceRecorder {
  const queue: TraceEvent[] = []
  let total = 0
  let flushes = 0
  let sending = false

  const persist = () => {
    try {
      if (queue.length === 0) deps.storage?.removeItem(deps.storageKey)
      else
        deps.storage?.setItem(
          deps.storageKey,
          JSON.stringify(queue.slice(-MAX_TRACE_EVENTS))
        )
    } catch {
      // Storage full or refused — the trace is best-effort.
    }
  }

  // What the last page of this tab never got to send.
  try {
    const carried = deps.storage?.getItem(deps.storageKey)
    if (carried) {
      for (const e of sanitizeTrace(JSON.parse(carried), deps.now())) {
        queue.push(e)
      }
      total = queue.length
    }
  } catch {
    // Unreadable — start clean.
  }

  return {
    note(k, extra) {
      if (total >= MAX_TOTAL_EVENTS) return
      total++
      queue.push({ t: deps.now(), k, ...extra })
      persist()
    },
    async flush() {
      if (sending || queue.length === 0 || flushes >= MAX_FLUSHES) return
      if (!deps.canSend()) return
      const batch = queue.splice(0, MAX_TRACE_EVENTS)
      sending = true
      flushes++
      // Out of the tab's storage BEFORE the request, not after it: a room
      // that remounts while this write is in flight (leave and rejoin, or a
      // double mount) would otherwise carry the same events and send them
      // twice. A page killed mid-request loses one batch; that is the rarer
      // and cheaper mistake.
      persist()
      let ok = false
      try {
        ok = await deps.send(batch)
      } catch {
        ok = false
      }
      // A refused or failed write goes back to the front; the flush cap is
      // what stops a server that keeps refusing from being asked forever.
      if (!ok) queue.unshift(...batch)
      sending = false
      persist()
    },
    pending: () => queue.length,
  }
}

type NoteListener = (k: TraceKind, d?: string) => void
const listeners = new Set<NoteListener>()

/**
 * A note from another part of the room (the wake lock, today) that has no
 * business knowing about the recorder. Goes nowhere when no room is mounted.
 */
export function noteTrace(k: TraceKind, d?: string): void {
  for (const l of listeners) {
    try {
      l(k, d)
    } catch {
      // A listener must never break its caller.
    }
  }
}

export function onTraceNote(listener: NoteListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
