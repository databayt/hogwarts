// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  getTabsForRole,
  getUIConfigForRole,
} from "@/components/school-dashboard/attendance/permissions"

describe("attendance UI permissions", () => {
  describe("getTabsForRole", () => {
    it("returns empty array for null role", () => {
      expect(getTabsForRole(null, "en")).toEqual([])
    })

    it("returns empty array for undefined role", () => {
      expect(getTabsForRole(undefined, "en")).toEqual([])
    })

    it("returns empty array for unsupported role (ACCOUNTANT)", () => {
      expect(getTabsForRole("ACCOUNTANT" as any, "en")).toEqual([])
    })

    // Five jobs, one tab each (+ Settings for admins). Merged pages keep
    // their routes and light up the tab they live under.
    it("DEVELOPER gets all tabs (admin + staff)", () => {
      const names = getTabsForRole("DEVELOPER", "en").map((t) => t.name)

      expect(names).toEqual([
        "Today",
        "Take attendance",
        "Excuses",
        "Students at risk",
        "Reports",
        "Settings",
      ])
    })

    it("ADMIN gets staff + Settings tab", () => {
      const names = getTabsForRole("ADMIN", "en").map((t) => t.name)

      expect(names).toContain("Take attendance")
      expect(names).toContain("Settings")
    })

    it("TEACHER gets staff tabs but NOT Settings", () => {
      const names = getTabsForRole("TEACHER", "en").map((t) => t.name)

      expect(names).toContain("Take attendance")
      expect(names).toContain("Reports")
      expect(names).not.toContain("Settings")
    })

    it("STAFF gets staff tabs but NOT Settings", () => {
      const names = getTabsForRole("STAFF", "en").map((t) => t.name)

      expect(names).toContain("Take attendance")
      expect(names).not.toContain("Settings")
    })

    it("merged pages light up their tab", () => {
      const take = getTabsForRole("ADMIN", "ar").find(
        (t) => t.name === "Take attendance"
      )

      expect(take?.href).toBe("/ar/attendance/manual")
      expect(take?.matchPrefixes).toContain("/ar/attendance/qr-code")
    })

    it("STUDENT gets non-staff (Records) instead of Manual", () => {
      const tabs = getTabsForRole("STUDENT", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Records")
      expect(names).not.toContain("Take attendance")
      expect(names).not.toContain("Reports")
      expect(names).not.toContain("Settings")
    })

    it("GUARDIAN gets Records + Excuses", () => {
      const tabs = getTabsForRole("GUARDIAN", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Records")
      expect(names).toContain("Excuses")
      expect(names).not.toContain("Settings")
    })

    it("uses dictionary values when provided", () => {
      const tabs = getTabsForRole("ADMIN", "en", {
        hub: { today: "اليوم", take: "التسجيل" },
      })

      expect(tabs[0]?.name).toBe("اليوم")
      expect(tabs.find((t) => t.name === "التسجيل")).toBeDefined()
    })

    it("hrefs include locale prefix", () => {
      const today = getTabsForRole("ADMIN", "ar").find((t) => t.name === "Today")

      expect(today?.href).toBe("/ar/attendance")
    })
  })

  describe("getUIConfigForRole", () => {
    it("returns NO_UI_PERMISSIONS for null role", () => {
      const result = getUIConfigForRole(null)
      expect(result).toBeDefined()
    })

    it("ADMIN gets full permissions", () => {
      const result = getUIConfigForRole("ADMIN")
      expect(result.showDeleteAction).toBe(true)
    })

    it("DEVELOPER gets full permissions", () => {
      const result = getUIConfigForRole("DEVELOPER")
      expect(result.showDeleteAction).toBe(true)
    })

    it("TEACHER gets staff permissions WITHOUT delete action", () => {
      const result = getUIConfigForRole("TEACHER")
      expect(result.showDeleteAction).toBe(false)
    })

    it("STAFF gets staff permissions WITHOUT delete action", () => {
      const result = getUIConfigForRole("STAFF")
      expect(result.showDeleteAction).toBe(false)
    })

    it("STUDENT gets readOnlyMode true", () => {
      const result = getUIConfigForRole("STUDENT")
      expect(result.readOnlyMode).toBe(true)
    })

    it("GUARDIAN gets readOnlyMode true", () => {
      const result = getUIConfigForRole("GUARDIAN")
      expect(result.readOnlyMode).toBe(true)
    })
  })
})
