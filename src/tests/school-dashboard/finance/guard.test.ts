// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    financePermission: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))

const { resolveFinanceAccess } =
  await import("@/components/school-dashboard/finance/guard")

const SCHOOL = "school-123"

/** getTenantContext resolves from the x-subdomain header — it always succeeds
 *  for a visitor on the subdomain, regardless of who (or whether) they are. */
function onSubdomain() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
  } as never)
}

function signedInAs(role: string, schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role, schoolId },
  } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({
    role,
    schoolId,
  } as never)
  vi.mocked(db.financePermission.findUnique).mockResolvedValue(null as never)
}

describe("finance/guard — resolveFinanceAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onSubdomain()
  })

  it("denies an anonymous visitor even though the subdomain resolves a schoolId", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const { schoolId, can } = await resolveFinanceAccess("payroll", ["view"])

    expect(schoolId).toBe(SCHOOL) // tenant resolved from the header...
    expect(can.view).toBe(false) // ...but that is not identity
    expect(db.user.findUnique).not.toHaveBeenCalled()
  })

  it.each(["STUDENT", "GUARDIAN", "TEACHER", "STAFF", "USER"])(
    "denies %s access to payroll (staff salary PII)",
    async (role) => {
      signedInAs(role)

      const { can } = await resolveFinanceAccess("payroll", ["view"])

      expect(can.view).toBe(false)
    }
  )

  it.each(["STUDENT", "GUARDIAN", "TEACHER", "STAFF", "USER"])(
    "denies %s access to salary structures",
    async (role) => {
      signedInAs(role)

      const { can } = await resolveFinanceAccess("salary", ["view"])

      expect(can.view).toBe(false)
    }
  )

  it.each(["ADMIN", "ACCOUNTANT", "DEVELOPER"])(
    "allows %s to view payroll",
    async (role) => {
      signedInAs(role)

      const { can } = await resolveFinanceAccess("payroll", ["view"])

      expect(can.view).toBe(true)
    }
  )

  it("denies an ADMIN of another school on this subdomain", async () => {
    signedInAs("ADMIN", "school-999")

    const { can } = await resolveFinanceAccess("payroll", ["view"])

    expect(can.view).toBe(false)
  })

  it("grants a STAFF member only the explicitly granted action", async () => {
    signedInAs("STAFF")
    vi.mocked(db.financePermission.findUnique).mockImplementation(
      (async (args: {
        where: { schoolId_userId_module_action: { action: string } }
      }) =>
        args.where.schoolId_userId_module_action.action === "view"
          ? { id: "perm-1" }
          : null) as never
    )

    const { can } = await resolveFinanceAccess("payroll", ["view", "approve"])

    expect(can.view).toBe(true)
    expect(can.approve).toBe(false)
  })

  it("resolves the session once regardless of how many actions are checked", async () => {
    signedInAs("ADMIN")

    await resolveFinanceAccess("payroll", [
      "view",
      "create",
      "process",
      "approve",
    ])

    expect(auth).toHaveBeenCalledTimes(1)
  })
})
