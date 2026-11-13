// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  RELOAD_FLOOR_MS,
  reloadDelayMs,
} from "@/components/school-dashboard/live/join-auto-open"

const MIN = 60_000

describe("reloadDelayMs — when the too-early page may reload itself", () => {
  it("waits out the server's duration, plus a small margin", () => {
    expect(
      reloadDelayMs({
        opensInMs: 10 * MIN,
        elapsedMs: 0,
        sinceLastReloadMs: null,
      })
    ).toBe(10 * MIN + 500)
  })

  it("counts the time the page has already been open", () => {
    expect(
      reloadDelayMs({
        opensInMs: 10 * MIN,
        elapsedMs: 4 * MIN,
        sinceLastReloadMs: null,
      })
    ).toBe(6 * MIN + 500)
  })

  it("is due once the duration has passed", () => {
    expect(
      reloadDelayMs({
        opensInMs: 10 * MIN,
        elapsedMs: 10 * MIN + 500,
        sinceLastReloadMs: null,
      })
    ).toBe(0)
    // A phone that slept through the timer wakes long past the opening.
    expect(
      reloadDelayMs({
        opensInMs: 10 * MIN,
        elapsedMs: 45 * MIN,
        sinceLastReloadMs: null,
      })
    ).toBe(0)
  })

  it("takes no time of day at all, so a fast device clock cannot make it due early", () => {
    // The old component compared the device's Date.now() with an absolute
    // instant: a clock ten minutes fast saw "open" at once and reloaded every
    // second. The inputs here are durations only; the same wait comes out
    // whatever the wall clock says.
    const wait = reloadDelayMs({
      opensInMs: 8 * MIN,
      elapsedMs: 1000,
      sinceLastReloadMs: null,
    })
    expect(wait).toBe(8 * MIN - 500)
  })

  it("a page that just reloaded waits out the 30-second floor, even when the room should be open", () => {
    expect(
      reloadDelayMs({
        opensInMs: 0,
        elapsedMs: 5000,
        sinceLastReloadMs: 4000,
      })
    ).toBe(RELOAD_FLOOR_MS - 4000)
    // A server answer that is "too early" by a hair cannot become a loop.
    expect(
      reloadDelayMs({
        opensInMs: -2000,
        elapsedMs: 0,
        sinceLastReloadMs: 1000,
      })
    ).toBe(RELOAD_FLOOR_MS - 1000)
  })

  it("the floor is over after 30 seconds", () => {
    expect(
      reloadDelayMs({
        opensInMs: 0,
        elapsedMs: 600,
        sinceLastReloadMs: RELOAD_FLOOR_MS,
      })
    ).toBe(0)
  })

  it("the longer of the two waits wins", () => {
    expect(
      reloadDelayMs({
        opensInMs: 5 * MIN,
        elapsedMs: 0,
        sinceLastReloadMs: 10_000,
      })
    ).toBe(5 * MIN + 500)
  })
})
