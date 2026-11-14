// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A screen share that fails tells the teacher why; closing the picker is a
 * choice and stays silent.
 */

import { describe, expect, it } from "vitest"

import { shareErrorMessage } from "@/components/school-dashboard/live/room/control-bar"
import { DEFAULT_ROOM_LABELS as L } from "@/components/school-dashboard/live/room/labels"

const err = (name: string, message = "") =>
  Object.assign(new Error(message), { name })

describe("shareErrorMessage", () => {
  it("is silent when the teacher closes the picker", () => {
    expect(shareErrorMessage(err("NotAllowedError", "Permission denied"), L)).toBeNull()
  })
  it("points a Mac at Screen Recording when the system refuses", () => {
    expect(
      shareErrorMessage(err("NotAllowedError", "Permission denied by system"), L)
    ).toBe(L.shareBlockedBySystem)
  })
  it("tells a phone it needs a computer", () => {
    expect(shareErrorMessage(err("NotSupportedError"), L)).toBe(L.shareNeedsComputer)
  })
  it("says it failed for anything else", () => {
    expect(shareErrorMessage(err("NotReadableError", "Could not start video source"), L)).toBe(
      L.shareFailed
    )
  })
})
