"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/**
 * Re-asks the join link once its window opens.
 *
 * Rendered on the "too early" state of `/live/join/[slot]`: a student who taps
 * Join at 15:40 for a 16:00 class should not have to tap again — the page
 * reloads itself at the opening instant, and the server (not this timer)
 * decides what happens then. An instant, not a wall-clock time, so a phone in
 * any zone fires at the same moment. A minute-cadence recheck covers a device
 * that slept through the timeout.
 */
export function JoinAutoOpen({ opensAtMs }: { opensAtMs: number }) {
  useEffect(() => {
    const reloadIfOpen = () => {
      if (Date.now() >= opensAtMs) window.location.reload()
    }
    // setTimeout overflows past ~24.8 days; a class that far out is not
    // "today", so clamping is only a guard against bad input.
    const wait = Math.min(
      Math.max(opensAtMs - Date.now() + 500, 1000),
      2 ** 31 - 1
    )
    const timer = setTimeout(reloadIfOpen, wait)
    const poll = setInterval(reloadIfOpen, 60_000)
    return () => {
      clearTimeout(timer)
      clearInterval(poll)
    }
  }, [opensAtMs])

  return null
}
