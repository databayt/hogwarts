// Copyright (c) 2025-present databayt/databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ALL_ROLES, type Role } from "@/lib/rbac/types"
import {
  FULL_UI_PERMISSIONS,
  NO_UI_PERMISSIONS,
} from "@/lib/rbac/ui-permissions"

import { getTabsForRole, getUIConfigForRole } from "@/components/school-dashboard/sales/permissions"

// Policy: ADMIN + DEVELOPER get full sales pipeline; every other role gets
// nothing. The matrix below is the policy — change it intentionally if you
// change the implementation.
const SALES_ADMIN_ROLES: ReadonlyArray<Role> = ["DEVELOPER", "ADMIN"]

describe("sales/permissions — getTabsForRole", () => {
  it.each(ALL_ROLES)("returns 3 sales tabs for %s only if admin", (role) => {
    const tabs = getTabsForRole(role, "en")
    if (SALES_ADMIN_ROLES.includes(role)) {
      expect(tabs).toHaveLength(3)
      expect(tabs[0].href).toBe("/en/sales")
      expect(tabs[1].href).toBe("/en/sales/import")
      expect(tabs[2].href).toBe("/en/sales/analytics")
    } else {
      expect(tabs).toEqual([])
    }
  })

  it("returns [] for a missing role (logged-out session)", () => {
    expect(getTabsForRole(null, "en")).toEqual([])
    expect(getTabsForRole(undefined, "en")).toEqual([])
  })

  it("honors the lang param for tab hrefs", () => {
    const arTabs = getTabsForRole("ADMIN", "ar")
    expect(arTabs[0].href).toBe("/ar/sales")
    expect(arTabs[1].href).toBe("/ar/sales/import")
    expect(arTabs[2].href).toBe("/ar/sales/analytics")
  })

  it("honors the dictionary param for tab names (RTL-friendly)", () => {
    const tabs = getTabsForRole("ADMIN", "ar", {
      navAll: "كل العملاء",
      navImport: "استيراد",
      navAnalytics: "تحليلات",
    })
    expect(tabs.map((t) => t.name)).toEqual([
      "كل العملاء",
      "استيراد",
      "تحليلات",
    ])
  })
})

describe("sales/permissions — getUIConfigForRole", () => {
  it.each(ALL_ROLES)(
    "%s gets FULL_UI for admins, NO_UI for everyone else",
    (role) => {
      const config = getUIConfigForRole(role)
      if (SALES_ADMIN_ROLES.includes(role)) {
        expect(config).toEqual(FULL_UI_PERMISSIONS)
      } else {
        expect(config).toEqual(NO_UI_PERMISSIONS)
      }
    }
  )

  it("returns NO_UI for null/undefined role (logged-out)", () => {
    expect(getUIConfigForRole(null)).toEqual(NO_UI_PERMISSIONS)
    expect(getUIConfigForRole(undefined)).toEqual(NO_UI_PERMISSIONS)
  })
})
