// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  ADMIN_ROLES,
  canHostLiveClass,
  canJoinAsGuardian,
  canJoinAsStudent,
  canManageLiveClasses,
  checkLiveClassPermission,
  HOST_ROLES,
  type LiveClassAction,
} from "@/components/school-dashboard/conference/authorization"

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

describe("LiveClass authorization", () => {
  describe("DEVELOPER bypass", () => {
    it("DEVELOPER passes every action even without schoolId", () => {
      const actions: LiveClassAction[] = [
        "manage_live_class",
        "start_live_class",
        "end_live_class",
        "join_as_host",
        "join_as_participant",
        "join_as_observer",
        "view_recordings",
        "delete_recording",
        "manage_settings",
        "read_school_dashboard",
      ]
      for (const action of actions) {
        expect(
          checkLiveClassPermission(
            { userId: USER_ID, role: "DEVELOPER", schoolId: null },
            action
          )
        ).toBe(true)
      }
    })
  })

  describe("schoolId requirement", () => {
    it("non-DEVELOPER without schoolId is denied", () => {
      expect(
        checkLiveClassPermission(
          { userId: USER_ID, role: "ADMIN", schoolId: null },
          "manage_live_class"
        )
      ).toBe(false)
    })
  })

  describe("PERMISSION_MATRIX", () => {
    const cases: {
      role: UserRole
      action: LiveClassAction
      expected: boolean
    }[] = [
      // manage_live_class
      { role: "ADMIN", action: "manage_live_class", expected: true },
      { role: "TEACHER", action: "manage_live_class", expected: false },
      { role: "STUDENT", action: "manage_live_class", expected: false },
      { role: "GUARDIAN", action: "manage_live_class", expected: false },
      // start/end
      { role: "TEACHER", action: "start_live_class", expected: true },
      { role: "TEACHER", action: "end_live_class", expected: true },
      { role: "STUDENT", action: "start_live_class", expected: false },
      // join roles
      { role: "TEACHER", action: "join_as_host", expected: true },
      { role: "STUDENT", action: "join_as_participant", expected: true },
      { role: "GUARDIAN", action: "join_as_observer", expected: true },
      { role: "STUDENT", action: "join_as_observer", expected: false },
      { role: "GUARDIAN", action: "join_as_participant", expected: false },
      // recordings
      { role: "STUDENT", action: "view_recordings", expected: true },
      { role: "GUARDIAN", action: "view_recordings", expected: true },
      { role: "TEACHER", action: "delete_recording", expected: false },
      { role: "ADMIN", action: "delete_recording", expected: true },
      // school dashboard
      { role: "ACCOUNTANT", action: "read_school_dashboard", expected: true },
      { role: "STUDENT", action: "read_school_dashboard", expected: false },
    ]
    for (const c of cases) {
      it(`${c.role} ${c.expected ? "can" : "cannot"} ${c.action}`, () => {
        expect(
          checkLiveClassPermission(
            { userId: USER_ID, role: c.role, schoolId: SCHOOL_ID },
            c.action
          )
        ).toBe(c.expected)
      })
    }
  })

  describe("Convenience helpers", () => {
    it("canManageLiveClasses → ADMIN, DEVELOPER only", () => {
      expect(canManageLiveClasses("ADMIN")).toBe(true)
      expect(canManageLiveClasses("DEVELOPER")).toBe(true)
      expect(canManageLiveClasses("TEACHER")).toBe(false)
      expect(canManageLiveClasses("STUDENT")).toBe(false)
    })
    it("canHostLiveClass → ADMIN, DEVELOPER, TEACHER", () => {
      expect(canHostLiveClass("TEACHER")).toBe(true)
      expect(canHostLiveClass("STUDENT")).toBe(false)
      expect(canHostLiveClass("GUARDIAN")).toBe(false)
    })
    it("canJoinAsStudent → STUDENT, DEVELOPER", () => {
      expect(canJoinAsStudent("STUDENT")).toBe(true)
      expect(canJoinAsStudent("TEACHER")).toBe(false)
    })
    it("canJoinAsGuardian → GUARDIAN, DEVELOPER", () => {
      expect(canJoinAsGuardian("GUARDIAN")).toBe(true)
      expect(canJoinAsGuardian("STUDENT")).toBe(false)
    })
  })

  describe("Role groups", () => {
    it("ADMIN_ROLES includes DEVELOPER + ADMIN", () => {
      expect(ADMIN_ROLES).toContain("DEVELOPER")
      expect(ADMIN_ROLES).toContain("ADMIN")
    })
    it("HOST_ROLES adds TEACHER", () => {
      expect(HOST_ROLES).toContain("TEACHER")
    })
  })
})
