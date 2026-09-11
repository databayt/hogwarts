"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

/**
 * The day's clock, shared by every role's "today" card.
 *
 * Lifted out of `student-client.tsx` on 2026-09-10 so the teacher card could
 * read the same clock rather than a second copy of it. The three pieces below
 * are one contract: a period bound is UTC, the reader's `now` is local, and
 * the comparison only starts after mount.
 */

/**
 * Minutes past midnight for a stored period bound.
 *
 * Period times are wall-clock, written as `Date.UTC(1970, 0, 1, h, m)` — the
 * timetable block's standing convention — so they are read back with
 * `getUTC*`. Reading them locally would shift every class by the reader's
 * offset: in Khartoum an 08:00 period would print and compare as 10:00.
 */
export function periodMinutes(value: string): number {
  const d = new Date(value)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

/** The same bound as a printable `HH:mm`. */
export function periodLabel(value: string): string {
  const d = new Date(value)
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`
}

/**
 * Minutes past midnight on the reader's own clock, `null` until mounted.
 *
 * The null pass is not a loading state, it is the hydration contract: the
 * callers are `"use client"` but Next renders them on the server first, and in
 * production the server's clock is UTC while the reader's is Khartoum. A
 * first render that already knew the time would disagree with itself. So the
 * server and the client's first paint both render the WHOLE day, and the
 * filtering starts one tick later — the reader sees the list settle, never a
 * mismatch.
 *
 * Ticking every 30s rather than on mount alone is what makes a period drop off
 * while the page sits open, which is the point of the filter: someone who
 * leaves the dashboard up through a lesson should watch it clear itself.
 *
 * Local `now` against UTC bounds is the timetable block's convention, shared
 * with `isRowLiveJoinable` and `getCurrentClass`: it lines up for a reader in
 * the school's timezone, which is the case that matters.
 */
export function useNowMinutes(): number | null {
  const [nowMin, setNowMin] = useState<number | null>(null)

  useEffect(() => {
    const read = () => {
      const now = new Date()
      setNowMin(now.getHours() * 60 + now.getMinutes())
    }
    read()
    const id = setInterval(read, 30_000)
    return () => clearInterval(id)
  }, [])

  return nowMin
}
