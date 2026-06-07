// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { getTabsForRole, getUIConfigForRole } from "@/components/school-dashboard/listings/classrooms/permissions"

describe("getTabsForRole", () => {
  it("returns no tabs for null/unknown role", () => {
    expect(getTabsForRole(null, "en")).toEqual([])
    expect(getTabsForRole(undefined, "en")).toEqual([])
    expect(getTabsForRole("STUDENT" as never, "en")).toEqual([])
    expect(getTabsForRole("GUARDIAN" as never, "en")).toEqual([])
  })

  it("ADMIN sees the full tab set (rooms + configure + capacity + subjects + schedule)", () => {
    const tabs = getTabsForRole("ADMIN", "en")
    const names = tabs.map((t) => t.name)
    expect(names).toEqual([
      "Rooms",
      "Configure",
      "Capacity",
      "Subjects",
      "Schedule",
    ])
    expect(tabs[0].href).toBe("/en/classrooms")
    expect(tabs[0].exact).toBe(true)
    expect(tabs[1].href).toBe("/en/classrooms/configure")
  })

  it("DEVELOPER sees the full tab set", () => {
    const tabs = getTabsForRole("DEVELOPER", "en")
    expect(tabs.map((t) => t.name)).toContain("Configure")
    expect(tabs.map((t) => t.name)).toContain("Capacity")
  })

  it("STAFF sees the full tab set (manage capable)", () => {
    const tabs = getTabsForRole("STAFF", "en")
    expect(tabs.map((t) => t.name)).toContain("Configure")
    expect(tabs.map((t) => t.name)).toContain("Capacity")
  })

  it("TEACHER sees only the read-only tabs (rooms, subjects, schedule) — no configure/capacity", () => {
    const tabs = getTabsForRole("TEACHER", "en")
    const names = tabs.map((t) => t.name)
    expect(names).toEqual(["Rooms", "Subjects", "Schedule"])
    expect(names).not.toContain("Configure")
    expect(names).not.toContain("Capacity")
  })

  it("uses translated labels when a navigation dictionary is provided", () => {
    const dict = {
      rooms: "الغرف",
      configure: "إعداد",
      capacity: "السعة",
      subjects: "المواد",
      schedule: "الجدول",
    }
    const tabs = getTabsForRole("ADMIN", "ar", dict)
    expect(tabs.map((t) => t.name)).toEqual([
      "الغرف",
      "إعداد",
      "السعة",
      "المواد",
      "الجدول",
    ])
  })

  it("respects the provided locale in href", () => {
    const tabs = getTabsForRole("ADMIN", "ar")
    expect(tabs[0].href).toBe("/ar/classrooms")
    expect(tabs[1].href).toBe("/ar/classrooms/configure")
  })
})

describe("getUIConfigForRole", () => {
  it("returns NO_UI_PERMISSIONS for null/unknown role", () => {
    const noPerms = getUIConfigForRole(null)
    expect(noPerms.showAddButton).toBe(false)
    expect(noPerms.showEditAction).toBe(false)
    expect(noPerms.showDeleteAction).toBe(false)
    expect(noPerms.readOnlyMode).toBe(true)

    expect(getUIConfigForRole(undefined).readOnlyMode).toBe(true)
    expect(getUIConfigForRole("STUDENT" as never).readOnlyMode).toBe(true)
  })

  it("DEVELOPER and ADMIN get FULL_UI_PERMISSIONS", () => {
    for (const role of ["DEVELOPER", "ADMIN"] as const) {
      const p = getUIConfigForRole(role)
      expect(p.showAddButton).toBe(true)
      expect(p.showEditAction).toBe(true)
      expect(p.showDeleteAction).toBe(true)
      expect(p.showBulkActions).toBe(true)
      expect(p.readOnlyMode).toBe(false)
    }
  })

  it("STAFF gets full permissions except delete", () => {
    const p = getUIConfigForRole("STAFF")
    expect(p.showAddButton).toBe(true)
    expect(p.showEditAction).toBe(true)
    expect(p.showDeleteAction).toBe(false)
    expect(p.readOnlyMode).toBe(false)
  })

  it("TEACHER is read-only with export enabled", () => {
    const p = getUIConfigForRole("TEACHER")
    expect(p.showAddButton).toBe(false)
    expect(p.showEditAction).toBe(false)
    expect(p.showDeleteAction).toBe(false)
    expect(p.showExportButton).toBe(true)
    expect(p.readOnlyMode).toBe(true)
  })

  it("STUDENT/GUARDIAN/ACCOUNTANT/USER fall through to NO_UI_PERMISSIONS", () => {
    for (const role of ["STUDENT", "GUARDIAN", "ACCOUNTANT", "USER"] as const) {
      const p = getUIConfigForRole(role)
      expect(p.showAddButton).toBe(false)
      expect(p.showEditAction).toBe(false)
      expect(p.showExportButton).toBe(false)
      expect(p.readOnlyMode).toBe(true)
    }
  })
})
