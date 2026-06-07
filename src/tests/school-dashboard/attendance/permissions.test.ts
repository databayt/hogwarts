// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { getTabsForRole, getUIConfigForRole } from "@/components/school-dashboard/attendance/permissions"

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

    it("DEVELOPER gets all tabs (admin + staff)", () => {
      const tabs = getTabsForRole("DEVELOPER", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Overview")
      expect(names).toContain("Manual")
      expect(names).toContain("QR Code")
      expect(names).toContain("Settings")
      expect(names).toContain("Analytics")
    })

    it("ADMIN gets staff + Settings tab", () => {
      const tabs = getTabsForRole("ADMIN", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Manual")
      expect(names).toContain("Settings")
    })

    it("TEACHER gets staff tabs but NOT Settings", () => {
      const tabs = getTabsForRole("TEACHER", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Manual")
      expect(names).toContain("Analytics")
      expect(names).not.toContain("Settings")
    })

    it("STAFF gets staff tabs but NOT Settings", () => {
      const tabs = getTabsForRole("STAFF", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Manual")
      expect(names).not.toContain("Settings")
    })

    it("STUDENT gets non-staff (Records) instead of Manual", () => {
      const tabs = getTabsForRole("STUDENT", "en")
      const names = tabs.map((t) => t.name)

      expect(names).toContain("Records")
      expect(names).not.toContain("Manual")
      expect(names).not.toContain("Analytics")
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
        overview: "نظرة عامة",
        manual: "يدوي",
      })

      expect(tabs[0]?.name).toBe("نظرة عامة")
      const manualTab = tabs.find((t) => t.name === "يدوي")
      expect(manualTab).toBeDefined()
    })

    it("hrefs include locale prefix", () => {
      const tabs = getTabsForRole("ADMIN", "ar")
      const overview = tabs.find((t) => t.name === "Overview")

      expect(overview?.href).toBe("/ar/attendance")
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
