// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  ADMIN_ROLES,
  assertAttendancePermission,
  canMarkAttendance,
  canViewSchoolAnalytics,
  checkAttendancePermission,
  getAuthContext,
  isAdminRole,
  isStaffRole,
  STAFF_ROLES,
  type AttendanceAction,
  type AuthContext,
} from "@/components/school-dashboard/attendance/authorization"

const ALL_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "USER",
]

const makeCtx = (
  role: UserRole,
  schoolId: string | null = "school-1"
): AuthContext => ({
  userId: "u1",
  role,
  schoolId,
})

describe("Attendance Authorization", () => {
  describe("checkAttendancePermission", () => {
    it("DEVELOPER bypasses all checks (no schoolId required)", () => {
      const ctx = makeCtx("DEVELOPER", null)
      const allActions: AttendanceAction[] = [
        "mark",
        "read_own",
        "read_class",
        "read_school",
        "delete",
        "restore",
        "bulk_upload",
        "export",
        "view_analytics",
        "view_compliance",
        "manage_settings",
        "manage_policy",
        "manage_intervention",
        "manage_excuse",
        "submit_excuse",
      ]
      for (const action of allActions) {
        expect(checkAttendancePermission(ctx, action)).toBe(true)
      }
    })

    it("denies non-DEVELOPER roles when schoolId is null", () => {
      for (const role of ALL_ROLES.filter((r) => r !== "DEVELOPER")) {
        const ctx = makeCtx(role, null)
        expect(checkAttendancePermission(ctx, "mark")).toBe(false)
      }
    })

    it("ADMIN can perform every action", () => {
      const ctx = makeCtx("ADMIN")
      expect(checkAttendancePermission(ctx, "mark")).toBe(true)
      expect(checkAttendancePermission(ctx, "restore")).toBe(true)
      expect(checkAttendancePermission(ctx, "view_compliance")).toBe(true)
      expect(checkAttendancePermission(ctx, "manage_settings")).toBe(true)
      expect(checkAttendancePermission(ctx, "submit_excuse")).toBe(true)
    })

    it("TEACHER can mark, read_class, delete, bulk_upload, export, analytics, manage_excuse", () => {
      const ctx = makeCtx("TEACHER")
      expect(checkAttendancePermission(ctx, "mark")).toBe(true)
      expect(checkAttendancePermission(ctx, "read_class")).toBe(true)
      expect(checkAttendancePermission(ctx, "delete")).toBe(true)
      expect(checkAttendancePermission(ctx, "bulk_upload")).toBe(true)
      expect(checkAttendancePermission(ctx, "export")).toBe(true)
      expect(checkAttendancePermission(ctx, "view_analytics")).toBe(true)
      expect(checkAttendancePermission(ctx, "manage_excuse")).toBe(true)
    })

    it("TEACHER cannot restore, view compliance, manage settings or policy", () => {
      const ctx = makeCtx("TEACHER")
      expect(checkAttendancePermission(ctx, "restore")).toBe(false)
      expect(checkAttendancePermission(ctx, "view_compliance")).toBe(false)
      expect(checkAttendancePermission(ctx, "manage_settings")).toBe(false)
      expect(checkAttendancePermission(ctx, "manage_policy")).toBe(false)
      expect(checkAttendancePermission(ctx, "manage_intervention")).toBe(false)
      expect(checkAttendancePermission(ctx, "submit_excuse")).toBe(false)
    })

    it("STUDENT can only read_own", () => {
      const ctx = makeCtx("STUDENT")
      expect(checkAttendancePermission(ctx, "read_own")).toBe(true)
      expect(checkAttendancePermission(ctx, "mark")).toBe(false)
      expect(checkAttendancePermission(ctx, "delete")).toBe(false)
      expect(checkAttendancePermission(ctx, "view_analytics")).toBe(false)
    })

    it("GUARDIAN can read_own and submit_excuse only", () => {
      const ctx = makeCtx("GUARDIAN")
      expect(checkAttendancePermission(ctx, "read_own")).toBe(true)
      expect(checkAttendancePermission(ctx, "submit_excuse")).toBe(true)
      expect(checkAttendancePermission(ctx, "mark")).toBe(false)
      expect(checkAttendancePermission(ctx, "view_analytics")).toBe(false)
    })

    it("STAFF can mark, read_school, view_analytics, manage_excuse, export", () => {
      const ctx = makeCtx("STAFF")
      expect(checkAttendancePermission(ctx, "mark")).toBe(true)
      expect(checkAttendancePermission(ctx, "read_school")).toBe(true)
      expect(checkAttendancePermission(ctx, "view_analytics")).toBe(true)
      expect(checkAttendancePermission(ctx, "manage_excuse")).toBe(true)
      expect(checkAttendancePermission(ctx, "export")).toBe(true)
    })

    it("STAFF cannot read_class or restore", () => {
      const ctx = makeCtx("STAFF")
      expect(checkAttendancePermission(ctx, "read_class")).toBe(false)
      expect(checkAttendancePermission(ctx, "restore")).toBe(false)
    })

    it("USER role denied everything", () => {
      const ctx = makeCtx("USER")
      expect(checkAttendancePermission(ctx, "mark")).toBe(false)
      expect(checkAttendancePermission(ctx, "read_own")).toBe(false)
    })

    it("falsy role denied", () => {
      const ctx: AuthContext = {
        userId: "u1",
        role: "" as UserRole,
        schoolId: "school-1",
      }
      expect(checkAttendancePermission(ctx, "mark")).toBe(false)
    })
  })

  describe("assertAttendancePermission", () => {
    it("does not throw when authorized", () => {
      expect(() =>
        assertAttendancePermission(makeCtx("ADMIN"), "mark")
      ).not.toThrow()
    })

    it("throws Error mentioning role + action when unauthorized", () => {
      expect(() =>
        assertAttendancePermission(makeCtx("STUDENT"), "mark")
      ).toThrow(/STUDENT/)
      expect(() =>
        assertAttendancePermission(makeCtx("STUDENT"), "mark")
      ).toThrow(/mark/)
    })
  })

  describe("isStaffRole", () => {
    it("true for DEVELOPER, ADMIN, TEACHER, STAFF", () => {
      for (const role of STAFF_ROLES) {
        expect(isStaffRole(role)).toBe(true)
      }
    })

    it("false for STUDENT, GUARDIAN, USER, ACCOUNTANT", () => {
      for (const role of [
        "STUDENT",
        "GUARDIAN",
        "USER",
        "ACCOUNTANT",
      ] as const) {
        expect(isStaffRole(role as UserRole)).toBe(false)
      }
    })
  })

  describe("canMarkAttendance", () => {
    it("true for DEVELOPER, ADMIN, TEACHER, STAFF", () => {
      for (const role of ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"] as const) {
        expect(canMarkAttendance(role)).toBe(true)
      }
    })

    it("false for STUDENT, GUARDIAN", () => {
      expect(canMarkAttendance("STUDENT")).toBe(false)
      expect(canMarkAttendance("GUARDIAN")).toBe(false)
    })
  })

  describe("canViewSchoolAnalytics", () => {
    it("true for DEVELOPER, ADMIN, TEACHER, STAFF", () => {
      for (const role of ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"] as const) {
        expect(canViewSchoolAnalytics(role)).toBe(true)
      }
    })

    it("false for STUDENT, GUARDIAN", () => {
      expect(canViewSchoolAnalytics("STUDENT")).toBe(false)
      expect(canViewSchoolAnalytics("GUARDIAN")).toBe(false)
    })
  })

  describe("isAdminRole", () => {
    it("true for DEVELOPER and ADMIN only", () => {
      for (const role of ADMIN_ROLES) {
        expect(isAdminRole(role)).toBe(true)
      }
    })

    it("false for TEACHER, STAFF, STUDENT, GUARDIAN", () => {
      expect(isAdminRole("TEACHER")).toBe(false)
      expect(isAdminRole("STAFF")).toBe(false)
      expect(isAdminRole("STUDENT")).toBe(false)
      expect(isAdminRole("GUARDIAN")).toBe(false)
    })
  })

  describe("getAuthContext", () => {
    it("returns null for null session", () => {
      expect(getAuthContext(null)).toBeNull()
    })

    it("returns null when user is missing", () => {
      expect(getAuthContext({} as never)).toBeNull()
    })

    it("returns null when user.id missing", () => {
      expect(getAuthContext({ user: { role: "ADMIN" } } as never)).toBeNull()
    })

    it("returns null when user.role missing", () => {
      expect(getAuthContext({ user: { id: "u1" } } as never)).toBeNull()
    })

    it("returns context with schoolId", () => {
      const ctx = getAuthContext({
        user: { id: "u1", role: "ADMIN", schoolId: "school-1" },
      })
      expect(ctx).toEqual({
        userId: "u1",
        role: "ADMIN",
        schoolId: "school-1",
      })
    })

    it("returns context with schoolId=null when missing", () => {
      const ctx = getAuthContext({
        user: { id: "u1", role: "DEVELOPER" },
      })
      expect(ctx).toEqual({
        userId: "u1",
        role: "DEVELOPER",
        schoolId: null,
      })
    })
  })
})
