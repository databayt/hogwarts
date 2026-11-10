"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useRoomContext } from "@livekit/components-react"
import {
  DisconnectReason,
  RoomEvent,
  type ConnectionQuality,
  type Participant,
} from "livekit-client"

import { recordConnectionTrace } from "@/components/school-dashboard/live/actions/connection-trace"

import { createTraceRecorder, onTraceNote } from "./connection-trace"

const FIRST_FLUSH_MS = 8_000
const FLUSH_EVERY_MS = 20_000
const TICK_MS = 5_000
/** A timer this late means the browser was suspended, not merely busy. */
const STALL_MS = 10_000
/** A link flapping between good and poor says so sixteen times, not sixty. */
const MAX_QUALITY_NOTES = 16

type NetworkInformation = {
  type?: string
  effectiveType?: string
  saveData?: boolean
  addEventListener?: (type: "change", listener: () => void) => void
  removeEventListener?: (type: "change", listener: () => void) => void
}

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection
}

/** "cellular/3g", "wifi/4g/save" — or "unknown" where the browser won't say. */
function networkWord(): string {
  const c = connection()
  if (!c) return "unknown"
  return (
    [c.type, c.effectiveType, c.saveData ? "save" : ""]
      .filter(Boolean)
      .join("/") || "unknown"
  )
}

/**
 * Record what this seat's connection goes through (./connection-trace.ts).
 *
 * Listeners only: no state, nothing rendered, and every failure is swallowed —
 * a diagnostic must never be the reason a class breaks.
 */
export function useConnectionTrace(sessionId: string) {
  const room = useRoomContext()

  useEffect(() => {
    if (typeof window === "undefined") return

    let storage: Storage | null = null
    try {
      storage = window.sessionStorage
    } catch {
      storage = null
    }
    const recorder = createTraceRecorder({
      now: () => Date.now(),
      send: async (events) => {
        const res = await recordConnectionTrace({ sessionId, events })
        return Boolean(res && "success" in res && res.success)
      },
      canSend: () =>
        document.visibilityState === "visible" && navigator.onLine !== false,
      storage,
      storageKey: `live-trace:${sessionId}`,
    })
    const flush = () => void recorder.flush().catch(() => {})
    // A page that just came back needs a moment before a request succeeds.
    const flushSoon = () => setTimeout(flush, 1_500)

    recorder.note("join", {
      d: `${document.visibilityState};${networkWord()};wake=${
        "wakeLock" in navigator ? "yes" : "no"
      }`,
    })

    let hiddenAt: number | null =
      document.visibilityState === "hidden" ? Date.now() : null
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now()
        recorder.note("hidden")
      } else {
        recorder.note(
          "visible",
          hiddenAt ? { ms: Date.now() - hiddenAt } : undefined
        )
        hiddenAt = null
        flushSoon()
      }
    }
    const onOffline = () => recorder.note("offline")
    const onOnline = () => {
      recorder.note("online")
      flushSoon()
    }
    let lastNetwork = networkWord()
    const onNetwork = () => {
      const word = networkWord()
      if (word === lastNetwork) return
      lastNetwork = word
      recorder.note("net", { d: word })
    }

    let lastTick = Date.now()
    const tick = () => {
      const now = Date.now()
      const late = now - lastTick - TICK_MS
      lastTick = now
      if (late > STALL_MS) {
        recorder.note("stall", { ms: late, d: document.visibilityState })
      }
    }

    let reconnectingAt: number | null = null
    const onSignal = () => recorder.note("signal")
    const onReconnecting = () => {
      reconnectingAt = Date.now()
      recorder.note("reconnecting", { d: document.visibilityState })
    }
    const onReconnected = () => {
      recorder.note(
        "reconnected",
        reconnectingAt ? { ms: Date.now() - reconnectingAt } : undefined
      )
      reconnectingAt = null
      flushSoon()
    }
    const onDisconnected = (reason?: DisconnectReason) => {
      recorder.note("disconnected", {
        d:
          reason === undefined
            ? "unknown"
            : (DisconnectReason[reason] ?? String(reason)),
      })
      flush()
    }
    let qualityNotes = 0
    const onQuality = (
      quality: ConnectionQuality,
      participant: Participant
    ) => {
      if (!participant.isLocal || qualityNotes >= MAX_QUALITY_NOTES) return
      qualityNotes++
      recorder.note("quality", { d: String(quality) })
    }
    const offNote = onTraceNote((k, d) =>
      recorder.note(k, d ? { d } : undefined)
    )

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    connection()?.addEventListener?.("change", onNetwork)
    room.on(RoomEvent.SignalReconnecting, onSignal)
    room.on(RoomEvent.Reconnecting, onReconnecting)
    room.on(RoomEvent.Reconnected, onReconnected)
    room.on(RoomEvent.Disconnected, onDisconnected)
    room.on(RoomEvent.ConnectionQualityChanged, onQuality)

    const first = setTimeout(flush, FIRST_FLUSH_MS)
    const every = setInterval(flush, FLUSH_EVERY_MS)
    const ticker = setInterval(tick, TICK_MS)

    return () => {
      clearTimeout(first)
      clearInterval(every)
      clearInterval(ticker)
      offNote()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
      connection()?.removeEventListener?.("change", onNetwork)
      room.off(RoomEvent.SignalReconnecting, onSignal)
      room.off(RoomEvent.Reconnecting, onReconnecting)
      room.off(RoomEvent.Reconnected, onReconnected)
      room.off(RoomEvent.Disconnected, onDisconnected)
      room.off(RoomEvent.ConnectionQualityChanged, onQuality)
      // Leaving the room is a soft navigation: the page lives on, so the last
      // events (the disconnect itself) can still be sent.
      flush()
    }
  }, [room, sessionId])
}
