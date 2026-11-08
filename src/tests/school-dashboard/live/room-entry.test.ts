// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { mayEnterRoom } from "@/components/school-dashboard/live/room-entry"

describe("mayEnterRoom — seeing a class is not entering it", () => {
  it("lets teaching roles and students in", () => {
    for (const role of ["DEVELOPER", "ADMIN", "TEACHER", "STUDENT"]) {
      expect(
        mayEnterRoom({ role, visibility: "section", guardiansObserve: false })
      ).toBe(true)
    }
  })

  it("lets a guardian in only where the school lets guardians watch", () => {
    expect(
      mayEnterRoom({
        role: "GUARDIAN",
        visibility: "section",
        guardiansObserve: true,
      })
    ).toBe(true)
    expect(
      mayEnterRoom({
        role: "GUARDIAN",
        visibility: "section",
        guardiansObserve: false,
      })
    ).toBe(false)
  })

  it("keeps staff and accountants out of a section class, in for a school-wide one", () => {
    for (const role of ["STAFF", "ACCOUNTANT"]) {
      expect(
        mayEnterRoom({ role, visibility: "section", guardiansObserve: true })
      ).toBe(false)
      expect(
        mayEnterRoom({ role, visibility: "school", guardiansObserve: true })
      ).toBe(true)
    }
  })

  it("refuses an unknown or missing role", () => {
    expect(
      mayEnterRoom({
        role: "USER",
        visibility: "school",
        guardiansObserve: true,
      })
    ).toBe(false)
    expect(
      mayEnterRoom({ role: null, visibility: "school", guardiansObserve: true })
    ).toBe(false)
  })
})
