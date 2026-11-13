"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/** A page that reloaded itself waits this long before it may do so again. */
export const RELOAD_FLOOR_MS = 30_000
const MARGIN_MS = 500
const RECHECK_MS = 60_000
const LAST_RELOAD_KEY = "live-join-auto-open:last"

/**
 * How long until this page may reload itself, in milliseconds from now.
 *
 * `opensInMs` is a DURATION measured by the server when it rendered the page,
 * and `elapsedMs` is how long this page has been open on the device. Nothing
 * here reads the device's wall clock as a time of day: a phone whose clock
 * runs ten minutes fast used to see "the room is open" at once, reload, get
 * "too early" from the server again, and reload — a full server page a second
 * until the room really opened.
 *
 * The floor is the second guard: whatever the arithmetic says, a page that
 * reloaded less than 30 seconds ago waits out the rest of those 30 seconds.
 */
export function reloadDelayMs(opts: {
  opensInMs: number
  elapsedMs: number
  sinceLastReloadMs: number | null
}): number {
  const untilOpen = Math.max(opts.opensInMs - opts.elapsedMs + MARGIN_MS, 0)
  const untilAllowed =
    opts.sinceLastReloadMs === null
      ? 0
      : Math.max(RELOAD_FLOOR_MS - opts.sinceLastReloadMs, 0)
  return Math.max(untilOpen, untilAllowed)
}

function readLastReload(): number | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_RELOAD_KEY)
    const at = raw ? Number(raw) : NaN
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

/**
 * Re-asks the join link once its window opens.
 *
 * Rendered on the "too early" state of `/live/join/[slot]`: a student who taps
 * Join at 15:40 for a 16:00 class should not have to tap again — the page
 * reloads itself when the room opens, and the server (not this timer) decides
 * what happens then. It counts down a duration the server measured, so the
 * device's clock and time zone do not matter. A minute-cadence recheck and a
 * check when the tab comes back cover a phone that slept through the timeout.
 */
export function JoinAutoOpen({ opensInMs }: { opensInMs: number }) {
  useEffect(() => {
    const mountedMono = performance.now()
    const mountedWall = Date.now()
    // Two rulers for "how long has this page been open": the monotonic one
    // survives a clock change, the wall one keeps counting through a sleep.
    // Both are differences, never a time of day.
    const elapsed = () =>
      Math.max(performance.now() - mountedMono, Date.now() - mountedWall, 0)
    const remaining = () => {
      const last = readLastReload()
      return reloadDelayMs({
        opensInMs,
        elapsedMs: elapsed(),
        sinceLastReloadMs: last === null ? null : Date.now() - last,
      })
    }
    const reloadIfOpen = () => {
      if (remaining() > 0) return
      try {
        window.sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()))
      } catch {
        // Private mode: the duration above is still the guard.
      }
      window.location.reload()
    }
    // setTimeout overflows past ~24.8 days; a class that far out is not
    // "today", so clamping is only a guard against bad input.
    const timer = setTimeout(
      reloadIfOpen,
      Math.min(Math.max(remaining(), 1000), 2 ** 31 - 1)
    )
    const poll = setInterval(reloadIfOpen, RECHECK_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") reloadIfOpen()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [opensInMs])

  return null
}
