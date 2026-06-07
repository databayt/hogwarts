// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  assertLibraryPermission,
  checkLibraryPermission,
  getAllowedActions,
  getAuthContext,
  type AuthContext,
  type LibraryAction,
} from "@/components/library/authorization"

const ALL_ACTIONS: LibraryAction[] = [
  "create",
  "read",
  "update",
  "delete",
  "borrow",
  "return",
  "admin",
]

const BORROWER_ACTIONS: LibraryAction[] = ["read", "borrow", "return"]
const READ_ONLY_ACTIONS: LibraryAction[] = ["read"]

function makeAuth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    userId: "user-123",
    role: "ADMIN" as any,
    schoolId: "school-123",
    ...overrides,
  }
}

describe("Library Authorization", () => {
  describe("checkLibraryPermission", () => {
    describe("DEVELOPER role", () => {
      it("grants all 7 permissions regardless of schoolId", () => {
        const auth = makeAuth({ role: "DEVELOPER" as any, schoolId: null })

        for (const action of ALL_ACTIONS) {
          expect(checkLibraryPermission(auth, action)).toBe(true)
        }
      })

      it("grants permission even for cross-school books", () => {
        const auth = makeAuth({
          role: "DEVELOPER" as any,
          schoolId: "school-1",
        })
        const book = { id: "book-1", schoolId: "school-other" }

        expect(checkLibraryPermission(auth, "read", book)).toBe(true)
      })
    })

    describe("ADMIN role", () => {
      it("grants all 7 permissions with schoolId", () => {
        const auth = makeAuth({ role: "ADMIN" as any, schoolId: "school-123" })

        for (const action of ALL_ACTIONS) {
          expect(checkLibraryPermission(auth, action)).toBe(true)
        }
      })

      it("denies all permissions without schoolId", () => {
        const auth = makeAuth({ role: "ADMIN" as any, schoolId: null })

        for (const action of ALL_ACTIONS) {
          expect(checkLibraryPermission(auth, action)).toBe(false)
        }
      })
    })

    describe("TEACHER, STUDENT, GUARDIAN roles", () => {
      const borrowerRoles = ["TEACHER", "STUDENT", "GUARDIAN"] as const

      borrowerRoles.forEach((role) => {
        it(`${role} gets read, borrow, return permissions`, () => {
          const auth = makeAuth({ role: role as any, schoolId: "school-123" })

          for (const action of BORROWER_ACTIONS) {
            expect(checkLibraryPermission(auth, action)).toBe(true)
          }
        })

        it(`${role} is denied create, update, delete, admin`, () => {
          const auth = makeAuth({ role: role as any, schoolId: "school-123" })
          const deniedActions: LibraryAction[] = [
            "create",
            "update",
            "delete",
            "admin",
          ]

          for (const action of deniedActions) {
            expect(checkLibraryPermission(auth, action)).toBe(false)
          }
        })
      })
    })

    describe("STAFF, ACCOUNTANT roles", () => {
      const readOnlyRoles = ["STAFF", "ACCOUNTANT"] as const

      readOnlyRoles.forEach((role) => {
        it(`${role} gets read-only permission`, () => {
          const auth = makeAuth({ role: role as any, schoolId: "school-123" })

          expect(checkLibraryPermission(auth, "read")).toBe(true)
        })

        it(`${role} is denied all non-read actions`, () => {
          const auth = makeAuth({ role: role as any, schoolId: "school-123" })
          const deniedActions: LibraryAction[] = [
            "create",
            "update",
            "delete",
            "borrow",
            "return",
            "admin",
          ]

          for (const action of deniedActions) {
            expect(checkLibraryPermission(auth, action)).toBe(false)
          }
        })
      })
    })

    describe("Cross-school denial", () => {
      it("denies access when book.schoolId differs from auth.schoolId", () => {
        const auth = makeAuth({
          role: "ADMIN" as any,
          schoolId: "school-123",
        })
        const book = { id: "book-1", schoolId: "school-other" }

        expect(checkLibraryPermission(auth, "read", book)).toBe(false)
      })

      it("allows access when book.schoolId matches auth.schoolId", () => {
        const auth = makeAuth({
          role: "ADMIN" as any,
          schoolId: "school-123",
        })
        const book = { id: "book-1", schoolId: "school-123" }

        expect(checkLibraryPermission(auth, "read", book)).toBe(true)
      })

      it("allows access when book has no schoolId", () => {
        const auth = makeAuth({
          role: "ADMIN" as any,
          schoolId: "school-123",
        })
        const book = { id: "book-1" }

        expect(checkLibraryPermission(auth, "read", book)).toBe(true)
      })
    })

    describe("USER role", () => {
      it("gets no permissions", () => {
        const auth = makeAuth({ role: "USER" as any, schoolId: "school-123" })

        for (const action of ALL_ACTIONS) {
          expect(checkLibraryPermission(auth, action)).toBe(false)
        }
      })
    })
  })

  describe("assertLibraryPermission", () => {
    it("throws on denied action", () => {
      const auth = makeAuth({ role: "STUDENT" as any, schoolId: "school-123" })

      expect(() => assertLibraryPermission(auth, "delete")).toThrow(
        "Unauthorized: STUDENT cannot delete library resource"
      )
    })

    it("includes book id in error message when provided", () => {
      const auth = makeAuth({ role: "STUDENT" as any, schoolId: "school-123" })
      const book = { id: "book-42", schoolId: "school-123" }

      expect(() => assertLibraryPermission(auth, "delete", book)).toThrow(
        "Unauthorized: STUDENT cannot delete library resource book-42"
      )
    })

    it("does not throw on allowed action", () => {
      const auth = makeAuth({ role: "ADMIN" as any, schoolId: "school-123" })

      expect(() => assertLibraryPermission(auth, "create")).not.toThrow()
    })

    it("does not throw for DEVELOPER on any action", () => {
      const auth = makeAuth({ role: "DEVELOPER" as any, schoolId: null })

      for (const action of ALL_ACTIONS) {
        expect(() => assertLibraryPermission(auth, action)).not.toThrow()
      }
    })
  })

  describe("getAuthContext", () => {
    it("returns null for null session", () => {
      expect(getAuthContext(null)).toBeNull()
    })

    it("returns null for undefined session", () => {
      expect(getAuthContext(undefined)).toBeNull()
    })

    it("returns null when user is missing", () => {
      expect(getAuthContext({} as any)).toBeNull()
    })

    it("extracts correct fields from valid session", () => {
      const session = {
        user: {
          id: "user-abc",
          role: "TEACHER",
          schoolId: "school-xyz",
        },
      }

      const context = getAuthContext(session)

      expect(context).toEqual({
        userId: "user-abc",
        role: "TEACHER",
        schoolId: "school-xyz",
      })
    })

    it("defaults schoolId to null when missing", () => {
      const session = {
        user: {
          id: "user-abc",
          role: "USER",
        },
      }

      const context = getAuthContext(session)

      expect(context).toEqual({
        userId: "user-abc",
        role: "USER",
        schoolId: null,
      })
    })
  })

  describe("getAllowedActions", () => {
    it("returns all 7 actions for DEVELOPER", () => {
      const actions = getAllowedActions("DEVELOPER" as any)

      expect(actions).toEqual(ALL_ACTIONS)
    })

    it("returns all 7 actions for ADMIN", () => {
      const actions = getAllowedActions("ADMIN" as any)

      expect(actions).toEqual(ALL_ACTIONS)
    })

    it("returns read, borrow, return for TEACHER", () => {
      const actions = getAllowedActions("TEACHER" as any)

      expect(actions).toEqual(BORROWER_ACTIONS)
    })

    it("returns read, borrow, return for STUDENT", () => {
      const actions = getAllowedActions("STUDENT" as any)

      expect(actions).toEqual(BORROWER_ACTIONS)
    })

    it("returns read, borrow, return for GUARDIAN", () => {
      const actions = getAllowedActions("GUARDIAN" as any)

      expect(actions).toEqual(BORROWER_ACTIONS)
    })

    it("returns read only for STAFF", () => {
      const actions = getAllowedActions("STAFF" as any)

      expect(actions).toEqual(READ_ONLY_ACTIONS)
    })

    it("returns read only for ACCOUNTANT", () => {
      const actions = getAllowedActions("ACCOUNTANT" as any)

      expect(actions).toEqual(READ_ONLY_ACTIONS)
    })

    it("returns empty array for unknown role", () => {
      const actions = getAllowedActions("UNKNOWN_ROLE" as any)

      expect(actions).toEqual([])
    })
  })
})
