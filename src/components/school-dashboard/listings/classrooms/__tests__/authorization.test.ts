// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  assertClassroomPermission,
  checkClassroomPermission,
  getAuthContext,
  type AuthContext,
  type ClassroomAction,
} from "../authorization"

const ALL_ACTIONS: ClassroomAction[] = ["create", "read", "update", "delete"]

function makeAuth(
  role: AuthContext["role"],
  schoolId: string | null = "s1"
): AuthContext {
  return { userId: "u1", role, schoolId }
}

describe("classroom authorization matrix", () => {
  describe("DEVELOPER", () => {
    it("has full access to every action regardless of school context", () => {
      const auth = makeAuth("DEVELOPER", null)
      for (const action of ALL_ACTIONS) {
        expect(checkClassroomPermission(auth, action)).toBe(true)
        expect(
          checkClassroomPermission(auth, action, { schoolId: "any" })
        ).toBe(true)
      }
    })
  })

  describe("ADMIN", () => {
    it("has full access within their own school", () => {
      const auth = makeAuth("ADMIN", "s1")
      for (const action of ALL_ACTIONS) {
        expect(checkClassroomPermission(auth, action, { schoolId: "s1" })).toBe(
          true
        )
      }
    })

    it("is denied when targeting another school's classroom", () => {
      const auth = makeAuth("ADMIN", "s1")
      for (const action of ALL_ACTIONS) {
        expect(checkClassroomPermission(auth, action, { schoolId: "s2" })).toBe(
          false
        )
      }
    })

    it("is denied without a school context on the session", () => {
      const auth = makeAuth("ADMIN", null)
      for (const action of ALL_ACTIONS) {
        expect(checkClassroomPermission(auth, action)).toBe(false)
      }
    })
  })

  describe("TEACHER", () => {
    it("can read but not mutate classrooms in their school", () => {
      const auth = makeAuth("TEACHER", "s1")
      expect(checkClassroomPermission(auth, "read", { schoolId: "s1" })).toBe(
        true
      )
      expect(checkClassroomPermission(auth, "create", { schoolId: "s1" })).toBe(
        false
      )
      expect(checkClassroomPermission(auth, "update", { schoolId: "s1" })).toBe(
        false
      )
      expect(checkClassroomPermission(auth, "delete", { schoolId: "s1" })).toBe(
        false
      )
    })

    it("cannot read another school's classrooms", () => {
      const auth = makeAuth("TEACHER", "s1")
      expect(checkClassroomPermission(auth, "read", { schoolId: "s2" })).toBe(
        false
      )
    })
  })

  describe("STAFF", () => {
    it("mirrors TEACHER read-only access", () => {
      const auth = makeAuth("STAFF", "s1")
      expect(checkClassroomPermission(auth, "read", { schoolId: "s1" })).toBe(
        true
      )
      expect(checkClassroomPermission(auth, "update", { schoolId: "s1" })).toBe(
        false
      )
    })
  })

  describe.each([
    "STUDENT",
    "GUARDIAN",
    "ACCOUNTANT",
    "USER",
  ] as AuthContext["role"][])("%s", (role) => {
    it("is denied for every action", () => {
      const auth = makeAuth(role, "s1")
      for (const action of ALL_ACTIONS) {
        expect(checkClassroomPermission(auth, action, { schoolId: "s1" })).toBe(
          false
        )
      }
    })
  })

  describe("assertClassroomPermission", () => {
    it("throws when permission is denied", () => {
      const auth = makeAuth("STUDENT", "s1")
      expect(() =>
        assertClassroomPermission(auth, "read", { schoolId: "s1" })
      ).toThrow(/Unauthorized/)
    })

    it("does not throw for authorized actions", () => {
      const auth = makeAuth("ADMIN", "s1")
      expect(() =>
        assertClassroomPermission(auth, "delete", { schoolId: "s1" })
      ).not.toThrow()
    })
  })

  describe("getAuthContext", () => {
    it("returns null when session lacks a user", () => {
      expect(getAuthContext(null)).toBeNull()
      expect(getAuthContext({})).toBeNull()
      expect(getAuthContext({ user: null })).toBeNull()
    })

    it("normalises a populated session into AuthContext", () => {
      const ctx = getAuthContext({
        user: { id: "u-1", role: "ADMIN", schoolId: "s-1" },
      })
      expect(ctx).toEqual({ userId: "u-1", role: "ADMIN", schoolId: "s-1" })
    })

    it("coerces missing schoolId to null (DEVELOPER case)", () => {
      const ctx = getAuthContext({ user: { id: "u-1", role: "DEVELOPER" } })
      expect(ctx?.schoolId).toBeNull()
    })
  })
})
