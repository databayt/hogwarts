// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import {
  canBulkActionResults,
  canCreateResult,
  canDeleteResult,
  canExportResults,
  checkResultPermission,
  getAllowedActions,
  getAuthContext,
  type AuthContext,
  type ResultAction,
  type ResultContext,
} from "../authorization"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
    studentGuardian: { findFirst: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const OTHER_SCHOOL = "school-2"
const USER = "user-1"

function ctx(role: AuthContext["role"], schoolId: string | null): AuthContext {
  return { userId: USER, role, schoolId }
}

function rc(
  schoolId = SCHOOL,
  overrides: Partial<ResultContext> = {}
): ResultContext {
  return { id: "result-1", gradedBy: USER, schoolId, ...overrides }
}

describe("getAuthContext", () => {
  it("returns null for missing session", () => {
    expect(getAuthContext(null)).toBeNull()
    expect(getAuthContext({})).toBeNull()
  })

  it("normalizes session to AuthContext", () => {
    const auth = getAuthContext({
      user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
    })
    expect(auth).toEqual({ userId: "u1", role: "ADMIN", schoolId: SCHOOL })
  })

  it("defaults missing schoolId to null", () => {
    const auth = getAuthContext({ user: { id: "u1", role: "USER" } })
    expect(auth?.schoolId).toBeNull()
  })
})

describe("checkResultPermission — DEVELOPER", () => {
  const role: AuthContext["role"] = "DEVELOPER"
  const allActions: ResultAction[] = [
    "create",
    "read",
    "update",
    "delete",
    "export",
    "bulk_action",
  ]

  it.each(allActions)("allows %s without schoolId", (action) => {
    expect(checkResultPermission(ctx(role, null), action, rc())).toBe(true)
  })

  it("allows actions across any school", () => {
    expect(
      checkResultPermission(ctx(role, SCHOOL), "delete", rc(OTHER_SCHOOL))
    ).toBe(true)
  })
})

describe("checkResultPermission — ADMIN", () => {
  const role: AuthContext["role"] = "ADMIN"

  it("requires schoolId", () => {
    expect(checkResultPermission(ctx(role, null), "create")).toBe(false)
  })

  it("allows all CRUD within own school", () => {
    const actions: ResultAction[] = [
      "read",
      "update",
      "delete",
      "export",
      "bulk_action",
    ]
    for (const action of actions) {
      expect(checkResultPermission(ctx(role, SCHOOL), action, rc(SCHOOL))).toBe(
        true
      )
    }
  })

  it("blocks cross-tenant access", () => {
    expect(
      checkResultPermission(ctx(role, SCHOOL), "delete", rc(OTHER_SCHOOL))
    ).toBe(false)
  })

  it("allows create without context (no result yet)", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "create")).toBe(true)
  })
})

describe("checkResultPermission — TEACHER", () => {
  const role: AuthContext["role"] = "TEACHER"

  it("can create within school", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "create")).toBe(true)
  })

  it("can read any result in their school", () => {
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "read",
        rc(SCHOOL, { gradedBy: "other-teacher" })
      )
    ).toBe(true)
  })

  it("cannot read results from other schools", () => {
    expect(
      checkResultPermission(ctx(role, SCHOOL), "read", rc(OTHER_SCHOOL))
    ).toBe(false)
  })

  it("can only update results they graded", () => {
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "update",
        rc(SCHOOL, { gradedBy: USER })
      )
    ).toBe(true)
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "update",
        rc(SCHOOL, { gradedBy: "other-teacher" })
      )
    ).toBe(false)
  })

  it("can only delete results they graded", () => {
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "delete",
        rc(SCHOOL, { gradedBy: USER })
      )
    ).toBe(true)
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "delete",
        rc(SCHOOL, { gradedBy: "other-teacher" })
      )
    ).toBe(false)
  })

  it("can export within school", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "export", rc(SCHOOL))).toBe(
      true
    )
  })

  it("cannot perform bulk actions", () => {
    expect(
      checkResultPermission(ctx(role, SCHOOL), "bulk_action", rc(SCHOOL))
    ).toBe(false)
  })

  it("update returns false if gradedBy is missing", () => {
    expect(
      checkResultPermission(
        ctx(role, SCHOOL),
        "update",
        rc(SCHOOL, { gradedBy: null })
      )
    ).toBe(false)
  })
})

describe("checkResultPermission — ACCOUNTANT", () => {
  const role: AuthContext["role"] = "ACCOUNTANT"

  it("can read in own school", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "read", rc(SCHOOL))).toBe(
      true
    )
  })

  it("can export in own school", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "export", rc(SCHOOL))).toBe(
      true
    )
  })

  it("cannot create, update, delete, or bulk", () => {
    const blocked: ResultAction[] = [
      "create",
      "update",
      "delete",
      "bulk_action",
    ]
    for (const action of blocked) {
      expect(checkResultPermission(ctx(role, SCHOOL), action, rc(SCHOOL))).toBe(
        false
      )
    }
  })

  it("blocks cross-tenant read", () => {
    expect(
      checkResultPermission(ctx(role, SCHOOL), "read", rc(OTHER_SCHOOL))
    ).toBe(false)
  })
})

describe("checkResultPermission — STAFF", () => {
  const role: AuthContext["role"] = "STAFF"

  it("can only read in own school", () => {
    expect(checkResultPermission(ctx(role, SCHOOL), "read", rc(SCHOOL))).toBe(
      true
    )
    expect(
      checkResultPermission(ctx(role, SCHOOL), "read", rc(OTHER_SCHOOL))
    ).toBe(false)
  })

  it("cannot mutate", () => {
    const blocked: ResultAction[] = [
      "create",
      "update",
      "delete",
      "export",
      "bulk_action",
    ]
    for (const action of blocked) {
      expect(checkResultPermission(ctx(role, SCHOOL), action, rc(SCHOOL))).toBe(
        false
      )
    }
  })
})

describe("checkResultPermission — STUDENT / GUARDIAN", () => {
  it("STUDENT can attempt read; ownership verified separately", () => {
    expect(checkResultPermission(ctx("STUDENT", SCHOOL), "read")).toBe(true)
  })

  it("GUARDIAN can attempt read; relationship verified separately", () => {
    expect(checkResultPermission(ctx("GUARDIAN", SCHOOL), "read")).toBe(true)
  })

  it.each([
    "create",
    "update",
    "delete",
    "export",
    "bulk_action",
  ] as ResultAction[])("STUDENT cannot %s", (action) => {
    expect(
      checkResultPermission(ctx("STUDENT", SCHOOL), action, rc(SCHOOL))
    ).toBe(false)
  })

  it.each([
    "create",
    "update",
    "delete",
    "export",
    "bulk_action",
  ] as ResultAction[])("GUARDIAN cannot %s", (action) => {
    expect(
      checkResultPermission(ctx("GUARDIAN", SCHOOL), action, rc(SCHOOL))
    ).toBe(false)
  })
})

describe("checkResultPermission — USER", () => {
  it("denies everything", () => {
    const allActions: ResultAction[] = [
      "create",
      "read",
      "update",
      "delete",
      "export",
      "bulk_action",
    ]
    for (const action of allActions) {
      expect(
        checkResultPermission(ctx("USER", SCHOOL), action, rc(SCHOOL))
      ).toBe(false)
    }
  })
})

describe("Convenience helpers", () => {
  it("canCreateResult covers DEVELOPER, ADMIN, TEACHER", () => {
    expect(canCreateResult("DEVELOPER")).toBe(true)
    expect(canCreateResult("ADMIN")).toBe(true)
    expect(canCreateResult("TEACHER")).toBe(true)
    expect(canCreateResult("ACCOUNTANT")).toBe(false)
    expect(canCreateResult("STAFF")).toBe(false)
    expect(canCreateResult("STUDENT")).toBe(false)
    expect(canCreateResult("GUARDIAN")).toBe(false)
    expect(canCreateResult("USER")).toBe(false)
  })

  it("canExportResults covers DEVELOPER, ADMIN, TEACHER, ACCOUNTANT", () => {
    expect(canExportResults("DEVELOPER")).toBe(true)
    expect(canExportResults("ADMIN")).toBe(true)
    expect(canExportResults("TEACHER")).toBe(true)
    expect(canExportResults("ACCOUNTANT")).toBe(true)
    expect(canExportResults("STAFF")).toBe(false)
    expect(canExportResults("STUDENT")).toBe(false)
  })

  it("canBulkActionResults limited to DEVELOPER and ADMIN", () => {
    expect(canBulkActionResults("DEVELOPER")).toBe(true)
    expect(canBulkActionResults("ADMIN")).toBe(true)
    expect(canBulkActionResults("TEACHER")).toBe(false)
  })

  it("canDeleteResult limited to DEVELOPER and ADMIN", () => {
    // Note: TEACHER can delete via checkResultPermission when they graded the
    // record, but the role-only helper is for top-level UI gating.
    expect(canDeleteResult("DEVELOPER")).toBe(true)
    expect(canDeleteResult("ADMIN")).toBe(true)
    expect(canDeleteResult("TEACHER")).toBe(false)
    expect(canDeleteResult("STUDENT")).toBe(false)
  })

  it("getAllowedActions returns the expected matrix", () => {
    expect(getAllowedActions("DEVELOPER")).toEqual([
      "create",
      "read",
      "update",
      "delete",
      "export",
      "bulk_action",
    ])
    expect(getAllowedActions("ADMIN")).toEqual([
      "create",
      "read",
      "update",
      "delete",
      "export",
      "bulk_action",
    ])
    expect(getAllowedActions("TEACHER")).toEqual([
      "create",
      "read",
      "update",
      "delete",
      "export",
    ])
    expect(getAllowedActions("ACCOUNTANT")).toEqual(["read", "export"])
    expect(getAllowedActions("STAFF")).toEqual(["read"])
    expect(getAllowedActions("STUDENT")).toEqual(["read"])
    expect(getAllowedActions("GUARDIAN")).toEqual(["read"])
    expect(getAllowedActions("USER")).toEqual([])
  })
})
