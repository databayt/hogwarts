"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

/**
 * The reader's clock as an instant, re-read every `intervalMs`.
 *
 * `null` until mounted, so a server render and the first client render agree
 * (nothing time-dependent renders before the clock is real). An instant, not
 * a wall-clock time: compared with the server-computed join windows
 * (`JoinWindowMs`), it gives the same answer on any device in any zone.
 */
export function useNowMs(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0)
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [intervalMs])
  return now
}

/** Is `nowMs` inside a join window? A missing window is never open. */
export function inJoinWindow(
  nowMs: number | null,
  w: { fromMs: number; untilMs: number } | undefined
): boolean {
  return nowMs !== null && !!w && nowMs >= w.fromMs && nowMs <= w.untilMs
}
