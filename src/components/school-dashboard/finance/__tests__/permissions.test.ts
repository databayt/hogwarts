// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ALL_ROLES, type Role } from "@/lib/rbac/types"
import {
  FULL_UI_PERMISSIONS,
  NO_UI_PERMISSIONS,
} from "@/lib/rbac/ui-permissions"

import {
  buildFinanceSubTabs,
  getFeesTabs,
  getFinanceRootTabs,
  getUIConfigForRole,
} from "../permissions"

// Finance policy buckets — change here if policy intentionally moves a role.
const FINANCE_WRITE: ReadonlyArray<Role> = ["DEVELOPER", "ADMIN", "ACCOUNTANT"]
const FEES_VIEW: ReadonlyArray<Role> = [
  "DEVELOPER",
  "ADMIN",
  "ACCOUNTANT",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "TEACHER",
]
// USER is intentionally excluded — neither a finance writer nor a fees viewer.

// ---------------------------------------------------------------------------
// getFinanceRootTabs
// ---------------------------------------------------------------------------

describe("finance/permissions — getFinanceRootTabs", () => {
  it.each(ALL_ROLES)(
    "%s gets the full 13-tab list iff they're a finance writer",
    (role) => {
      const tabs = getFinanceRootTabs(role, "en")
      if (FINANCE_WRITE.includes(role)) {
        // 7 visible: overview, invoice, banking, fees, salary, payroll, reports
        // 6 hidden: receipt, timesheet, wallet, budget, expenses, accounts
        expect(tabs.length).toBe(13)
        const labels = tabs.map((t) => t.name)
        expect(labels).toContain("Overview")
        expect(labels).toContain("Invoice")
        expect(labels).toContain("Payroll")
      } else {
        // Non-writers get a 2-tab "viewer" list (Overview + Fees) so they
        // can at least see their own balance.
        expect(tabs.length).toBe(2)
        expect(tabs.map((t) => t.name)).toEqual(["Overview", "Fees"])
      }
    }
  )

  it("hides 6 of 13 tabs behind hidden:true for writers (sidebar shows 7 primary)", () => {
    const tabs = getFinanceRootTabs("ADMIN", "en")
    const visible = tabs.filter((t) => !t.hidden)
    const hidden = tabs.filter((t) => t.hidden)
    expect(visible.length).toBe(7)
    expect(hidden.length).toBe(6)
  })

  it("honors the lang param across both writer + viewer paths", () => {
    expect(getFinanceRootTabs("ADMIN", "ar")[0].href).toBe("/ar/finance")
    expect(getFinanceRootTabs("STUDENT", "ar")[0].href).toBe("/ar/finance")
    expect(getFinanceRootTabs("STUDENT", "ar")[1].href).toBe("/ar/finance/fees")
  })
})

// ---------------------------------------------------------------------------
// getFeesTabs
// ---------------------------------------------------------------------------

describe("finance/permissions — getFeesTabs", () => {
  it.each(ALL_ROLES)("%s gets the right Fees tabs based on role", (role) => {
    const tabs = getFeesTabs(role, "en")
    const isWriter = FINANCE_WRITE.includes(role)
    const isViewer = FEES_VIEW.includes(role)

    if (isWriter) {
      // 7 admin tabs: overview/structures/assignments/payments/scholarships/fines/reports
      expect(tabs.length).toBe(7)
      expect(tabs[0].href).toBe("/en/finance/fees")
    } else if (isViewer) {
      // Student/Guardian/Staff/Teacher get a single "My Fees" tab
      expect(tabs.length).toBe(1)
      expect(tabs[0].href).toBe("/en/finance/fees/my")
    } else {
      // USER + (no-one else currently) get []
      expect(tabs).toEqual([])
    }
  })

  it("returns [] for null/undefined (logged-out)", () => {
    expect(getFeesTabs(null, "en")).toEqual([])
    expect(getFeesTabs(undefined, "en")).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// buildFinanceSubTabs
// ---------------------------------------------------------------------------

describe("finance/permissions — buildFinanceSubTabs", () => {
  const SAMPLE_CONFIG = {
    tabs: [
      { key: "overview", segment: "", defaultLabel: "Overview" },
      { key: "structures", segment: "structures", defaultLabel: "Structures" },
    ],
  }

  it("returns [] for non-finance-writer roles", () => {
    for (const role of ALL_ROLES) {
      if (FINANCE_WRITE.includes(role)) continue
      expect(buildFinanceSubTabs(role, "en", "wallet", SAMPLE_CONFIG)).toEqual(
        []
      )
    }
  })

  it("builds module-specific tabs for finance writers", () => {
    const tabs = buildFinanceSubTabs(
      "ACCOUNTANT",
      "en",
      "wallet",
      SAMPLE_CONFIG
    )
    expect(tabs).toEqual([
      { name: "Overview", href: "/en/finance/wallet" },
      { name: "Structures", href: "/en/finance/wallet/structures" },
    ])
  })
})

// ---------------------------------------------------------------------------
// getUIConfigForRole
// ---------------------------------------------------------------------------

describe("finance/permissions — getUIConfigForRole", () => {
  it.each(ALL_ROLES)("%s gets the right UIPermissions shape", (role) => {
    const config = getUIConfigForRole(role)
    if (FINANCE_WRITE.includes(role)) {
      expect(config).toEqual(FULL_UI_PERMISSIONS)
    } else {
      // Non-writers get a read-only shape (explicit override of just the
      // readOnlyMode flag on top of NO_UI_PERMISSIONS).
      expect(config.readOnlyMode).toBe(true)
      // Every action flag must be denied for non-writers.
      const denyFlags = Object.entries(config).filter(
        ([k]) => k !== "readOnlyMode"
      )
      for (const [k, v] of denyFlags) {
        expect(v, `${k} should be false for ${role}`).toBe(false)
      }
    }
  })

  it("returns NO_UI_PERMISSIONS for null role (logged-out)", () => {
    expect(getUIConfigForRole(null)).toEqual(NO_UI_PERMISSIONS)
  })
})
