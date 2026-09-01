// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The tab strip actually rendered by `(app)/layout.tsx` — `list-permissions`'
 * `getTabsForRole`, not the dormant rich-layer one in `permissions.ts` that
 * `permissions.test.ts` covers. The two are deliberately separate layers
 * (see the block's CLAUDE.md); this is the one on screen.
 */
import { describe, expect, it } from "vitest"

import {
  getTabsForRole,
  type ConferenceNavDictionary,
} from "@/components/school-dashboard/live/list-permissions"

const dict: ConferenceNavDictionary = {
  tabs: {
    sessions: "Sessions",
    schedule: "Schedule",
    settings: "Settings",
    networkTest: "Network test",
  },
}

describe("conference tab strip (list-permissions.getTabsForRole)", () => {
  it("gives a signed-out viewer no tabs at all", () => {
    expect(getTabsForRole(null, "en", dict)).toEqual([])
  })

  it("shows STUDENT only Sessions — no surface they'd be redirected out of", () => {
    const tabs = getTabsForRole("STUDENT", "en", dict)
    expect(tabs.map((t) => t.name)).toEqual(["Sessions"])
  })

  it("shows GUARDIAN the same single tab as STUDENT", () => {
    expect(getTabsForRole("GUARDIAN", "en", dict).map((t) => t.name)).toEqual([
      "Sessions",
    ])
  })

  it("adds Schedule for TEACHER but keeps the admin surfaces hidden", () => {
    const names = getTabsForRole("TEACHER", "en", dict).map((t) => t.name)
    expect(names).toEqual(["Sessions", "Schedule"])
  })

  it("gives ADMIN every surface", () => {
    const names = getTabsForRole("ADMIN", "en", dict).map((t) => t.name)
    expect(names).toEqual(["Sessions", "Schedule", "Settings", "Network test"])
  })

  it("gives DEVELOPER the same surfaces as ADMIN", () => {
    expect(getTabsForRole("DEVELOPER", "en", dict).map((t) => t.name)).toEqual(
      getTabsForRole("ADMIN", "en", dict).map((t) => t.name)
    )
  })

  it("points Sessions at /conference/dashboard, never at the landing page", () => {
    const [sessions] = getTabsForRole("ADMIN", "ar", dict)
    expect(sessions.href).toBe("/ar/conference/dashboard")
  })

  it("builds every href under the requested locale", () => {
    for (const tab of getTabsForRole("ADMIN", "ar", dict)) {
      expect(tab.href.startsWith("/ar/conference/")).toBe(true)
    }
  })

  it("falls back to English labels when the dictionary slice is missing", () => {
    const names = getTabsForRole("ADMIN", "en").map((t) => t.name)
    expect(names).toEqual(["Sessions", "Schedule", "Settings", "Network test"])
  })
})
