// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  FULL_UI_PERMISSIONS,
  NO_UI_PERMISSIONS,
  READ_ONLY_UI_PERMISSIONS,
} from "@/lib/rbac/ui-permissions"

import { getTabsForRole, getUIConfigForRole } from "../permissions"

const fakeDict = {
  liveClasses: {
    nav: {
      upcoming: "Upcoming",
      live: "Live now",
      past: "Past",
      schedule: "Schedule",
      networkTest: "Network test",
    },
  },
} as never

describe("getTabsForRole", () => {
  it("STUDENT sees 3 tabs (upcoming / live / past), no schedule, no network-test", () => {
    const tabs = getTabsForRole("STUDENT", "en", fakeDict)
    expect(tabs.map((t) => t.name)).toEqual(["Upcoming", "Live now", "Past"])
  })

  it("GUARDIAN sees the same 3 tabs as STUDENT", () => {
    const tabs = getTabsForRole("GUARDIAN", "en", fakeDict)
    expect(tabs.map((t) => t.name)).toEqual(["Upcoming", "Live now", "Past"])
  })

  it("TEACHER also sees Schedule", () => {
    const tabs = getTabsForRole("TEACHER", "en", fakeDict)
    expect(tabs.map((t) => t.name)).toContain("Schedule")
    expect(tabs.map((t) => t.name)).not.toContain("Network test")
  })

  it("ADMIN sees Schedule + Network test", () => {
    const tabs = getTabsForRole("ADMIN", "en", fakeDict)
    expect(tabs.map((t) => t.name)).toContain("Schedule")
    expect(tabs.map((t) => t.name)).toContain("Network test")
  })

  it("DEVELOPER sees Schedule + Network test", () => {
    const tabs = getTabsForRole("DEVELOPER", "en", fakeDict)
    expect(tabs.map((t) => t.name)).toContain("Schedule")
    expect(tabs.map((t) => t.name)).toContain("Network test")
  })

  it("tab hrefs are clean (no /s/[subdomain]) and locale-prefixed", () => {
    const tabs = getTabsForRole("TEACHER", "ar", fakeDict)
    for (const tab of tabs) {
      expect(tab.href.startsWith("/ar/conference")).toBe(true)
      expect(tab.href).not.toContain("/s/")
    }
  })

  it("falls back to English labels when dictionary keys are missing", () => {
    const tabs = getTabsForRole("STUDENT", "en", { liveClasses: {} } as never)
    expect(tabs.length).toBeGreaterThan(0)
    expect(tabs[0].name).toBeTruthy()
  })
})

describe("getUIConfigForRole", () => {
  it("DEVELOPER gets FULL_UI_PERMISSIONS", () => {
    expect(getUIConfigForRole("DEVELOPER")).toBe(FULL_UI_PERMISSIONS)
  })
  it("ADMIN gets FULL_UI_PERMISSIONS", () => {
    expect(getUIConfigForRole("ADMIN")).toBe(FULL_UI_PERMISSIONS)
  })
  it("TEACHER can add + edit but NOT delete", () => {
    const cfg = getUIConfigForRole("TEACHER")
    expect(cfg.showAddButton).toBe(true)
    expect(cfg.showEditAction).toBe(true)
    expect(cfg.showDeleteAction).toBe(false)
  })
  it("STUDENT + GUARDIAN are READ_ONLY", () => {
    expect(getUIConfigForRole("STUDENT")).toBe(READ_ONLY_UI_PERMISSIONS)
    expect(getUIConfigForRole("GUARDIAN")).toBe(READ_ONLY_UI_PERMISSIONS)
  })
  it("STAFF + ACCOUNTANT are READ_ONLY", () => {
    expect(getUIConfigForRole("STAFF")).toBe(READ_ONLY_UI_PERMISSIONS)
    expect(getUIConfigForRole("ACCOUNTANT")).toBe(READ_ONLY_UI_PERMISSIONS)
  })
  it("USER (no school role) gets NO_UI_PERMISSIONS", () => {
    expect(getUIConfigForRole("USER")).toBe(NO_UI_PERMISSIONS)
  })
})
