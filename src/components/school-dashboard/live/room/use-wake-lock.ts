"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { noteTrace } from "./connection-trace"

/**
 * Keep the screen awake while a class is on.
 *
 * A phone showing the teacher's picture stays awake by itself — a playing
 * video holds the screen. A class on the BOARD, on slides, or one that fell
 * back to audio only has no playing video, so the phone dims, locks, and the
 * browser suspends the call: the student drops out of a class they were
 * listening to.
 *
 * The lock is released by the browser whenever the tab is hidden, so it is
 * taken again each time the page becomes visible. Where the API is missing
 * (older browsers) or refused (battery saver) this does nothing — never an
 * error the class should see.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = () => {
      if (document.visibilityState !== "visible") return
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) {
            void lock.release().catch(() => {})
            return
          }
          sentinel = lock
          noteTrace("wake", "on")
          // The browser lets go of it whenever the page is hidden.
          lock.addEventListener?.("release", () => noteTrace("wake", "released"))
        })
        .catch(() => noteTrace("wake", "refused"))
    }

    acquire()
    document.addEventListener("visibilitychange", acquire)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", acquire)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
