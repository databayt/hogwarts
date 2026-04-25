// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  assertStreamPermission,
  checkStreamPermission,
  getAuthContext,
  type AuthContext,
  type CourseContext,
  type StreamAction,
} from "../authorization"

const ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

const ACTIONS: StreamAction[] = ["create", "read", "update", "delete", "enroll"]

const ctx = (overrides: Partial<AuthContext> = {}): AuthContext => ({
  userId: "user-1",
  role: "STUDENT",
  schoolId: "school-1",
  ...overrides,
})

describe("checkStreamPermission", () => {
  describe("DEVELOPER", () => {
    it("grants every action regardless of school context", () => {
      const auth = ctx({ role: "DEVELOPER", schoolId: null })
      for (const action of ACTIONS) {
        expect(checkStreamPermission(auth, action)).toBe(true)
      }
    })

    it("can act on courses owned by other schools", () => {
      const auth = ctx({ role: "DEVELOPER", schoolId: null })
      const otherSchool: CourseContext = {
        id: "c1",
        userId: "x",
        schoolId: "other",
      }
      expect(checkStreamPermission(auth, "delete", otherSchool)).toBe(true)
    })
  })

  describe("school context required", () => {
    it("denies non-DEVELOPER without schoolId", () => {
      const auth = ctx({ role: "ADMIN", schoolId: null })
      for (const action of ACTIONS) {
        expect(checkStreamPermission(auth, action)).toBe(false)
      }
    })
  })

  describe("cross-tenant", () => {
    it("denies any action when course belongs to a different school", () => {
      const auth = ctx({ role: "ADMIN", schoolId: "school-1" })
      const foreign: CourseContext = { schoolId: "school-2" }
      for (const action of ACTIONS) {
        expect(checkStreamPermission(auth, action, foreign)).toBe(false)
      }
    })

    it("permits any action when course belongs to same school", () => {
      const auth = ctx({ role: "ADMIN", schoolId: "school-1" })
      const same: CourseContext = { schoolId: "school-1" }
      for (const action of ACTIONS) {
        expect(checkStreamPermission(auth, action, same)).toBe(true)
      }
    })
  })

  describe("read", () => {
    it("is granted to every authenticated role within a school", () => {
      for (const role of ROLES) {
        if (role === "USER") continue
        const auth = ctx({ role })
        expect(checkStreamPermission(auth, "read")).toBe(true)
      }
    })
  })

  describe("enroll", () => {
    it.each([
      ["ADMIN", true],
      ["TEACHER", true],
      ["STUDENT", true],
      ["GUARDIAN", true],
      ["STAFF", false],
      ["ACCOUNTANT", false],
      ["USER", false],
    ] as const)("role %s -> %s", (role, expected) => {
      const auth = ctx({ role: role as UserRole })
      expect(checkStreamPermission(auth, "enroll")).toBe(expected)
    })
  })

  describe("ADMIN", () => {
    it("can create/update/delete inside its school", () => {
      const auth = ctx({ role: "ADMIN" })
      expect(checkStreamPermission(auth, "create")).toBe(true)
      expect(checkStreamPermission(auth, "update")).toBe(true)
      expect(checkStreamPermission(auth, "delete")).toBe(true)
    })
  })

  describe("TEACHER", () => {
    it("can create courses", () => {
      const auth = ctx({ role: "TEACHER" })
      expect(checkStreamPermission(auth, "create")).toBe(true)
    })

    it("can update OWN courses", () => {
      const auth = ctx({ role: "TEACHER", userId: "t-1" })
      const own: CourseContext = { userId: "t-1", schoolId: "school-1" }
      expect(checkStreamPermission(auth, "update", own)).toBe(true)
    })

    it("cannot update someone else's course", () => {
      const auth = ctx({ role: "TEACHER", userId: "t-1" })
      const others: CourseContext = { userId: "t-2", schoolId: "school-1" }
      expect(checkStreamPermission(auth, "update", others)).toBe(false)
    })

    it("cannot update without course context", () => {
      const auth = ctx({ role: "TEACHER" })
      expect(checkStreamPermission(auth, "update")).toBe(false)
    })

    it("can delete OWN courses", () => {
      const auth = ctx({ role: "TEACHER", userId: "t-1" })
      const own: CourseContext = { userId: "t-1", schoolId: "school-1" }
      expect(checkStreamPermission(auth, "delete", own)).toBe(true)
    })

    it("cannot delete someone else's course", () => {
      const auth = ctx({ role: "TEACHER", userId: "t-1" })
      const others: CourseContext = { userId: "t-2", schoolId: "school-1" }
      expect(checkStreamPermission(auth, "delete", others)).toBe(false)
    })
  })

  describe("STUDENT / GUARDIAN", () => {
    it.each(["STUDENT", "GUARDIAN"] as const)(
      "%s cannot create/update/delete",
      (role) => {
        const auth = ctx({ role })
        expect(checkStreamPermission(auth, "create")).toBe(false)
        expect(checkStreamPermission(auth, "update")).toBe(false)
        expect(checkStreamPermission(auth, "delete")).toBe(false)
      }
    )
  })

  describe("STAFF / ACCOUNTANT / USER", () => {
    it.each(["STAFF", "ACCOUNTANT", "USER"] as const)(
      "%s cannot create/update/delete/enroll",
      (role) => {
        const auth = ctx({ role })
        expect(checkStreamPermission(auth, "create")).toBe(false)
        expect(checkStreamPermission(auth, "update")).toBe(false)
        expect(checkStreamPermission(auth, "delete")).toBe(false)
        expect(checkStreamPermission(auth, "enroll")).toBe(false)
      }
    )
  })
})

describe("assertStreamPermission", () => {
  it("does not throw when permitted", () => {
    const auth = ctx({ role: "DEVELOPER", schoolId: null })
    expect(() => assertStreamPermission(auth, "delete")).not.toThrow()
  })

  it("throws Unauthorized for denied action", () => {
    const auth = ctx({ role: "STAFF" })
    expect(() => assertStreamPermission(auth, "create")).toThrowError(
      /Unauthorized/
    )
  })

  it("includes course id in error message when provided", () => {
    const auth = ctx({ role: "STAFF" })
    expect(() =>
      assertStreamPermission(auth, "delete", { id: "course-9" })
    ).toThrowError(/course-9/)
  })
})

describe("getAuthContext", () => {
  it("returns null for missing session", () => {
    expect(getAuthContext(null)).toBeNull()
    expect(getAuthContext(undefined)).toBeNull()
    expect(getAuthContext({})).toBeNull()
  })

  it("extracts user fields from a session", () => {
    const session = {
      user: { id: "u-1", role: "ADMIN", schoolId: "s-1" },
    }
    expect(getAuthContext(session)).toEqual({
      userId: "u-1",
      role: "ADMIN",
      schoolId: "s-1",
    })
  })

  it("normalises missing schoolId to null", () => {
    const session = { user: { id: "u-1", role: "DEVELOPER" } }
    expect(getAuthContext(session)).toEqual({
      userId: "u-1",
      role: "DEVELOPER",
      schoolId: null,
    })
  })
})
