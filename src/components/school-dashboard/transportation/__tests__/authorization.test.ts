// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  ADMIN_ROLES,
  canManageAssignments,
  canManageDrivers,
  canManageRoutes,
  canManageVehicles,
  canReadAllAssignments,
  canViewFees,
  checkTransportationPermission,
  STAFF_ROLES,
  type TransportationAction,
} from "../authorization"

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

describe("Transportation authorization", () => {
  describe("DEVELOPER bypass", () => {
    it("DEVELOPER passes every action even without schoolId", () => {
      const actions: TransportationAction[] = [
        "manage_vehicle",
        "manage_route",
        "manage_stop",
        "manage_driver",
        "manage_assignment",
        "manage_settings",
        "read_school",
        "read_own",
        "view_fees",
      ]
      for (const action of actions) {
        expect(
          checkTransportationPermission(
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
        checkTransportationPermission(
          { userId: USER_ID, role: "ADMIN", schoolId: null },
          "manage_vehicle"
        )
      ).toBe(false)
    })
  })

  describe("PERMISSION_MATRIX", () => {
    type Case = {
      role:
        | "DEVELOPER"
        | "ADMIN"
        | "STAFF"
        | "TEACHER"
        | "STUDENT"
        | "GUARDIAN"
        | "ACCOUNTANT"
        | "USER"
      action: TransportationAction
      expected: boolean
    }

    const cases: Case[] = [
      // ADMIN can manage everything
      { role: "ADMIN", action: "manage_vehicle", expected: true },
      { role: "ADMIN", action: "manage_route", expected: true },
      { role: "ADMIN", action: "manage_driver", expected: true },
      { role: "ADMIN", action: "manage_assignment", expected: true },
      { role: "ADMIN", action: "manage_settings", expected: true },
      // STAFF can only manage assignments + read
      { role: "STAFF", action: "manage_assignment", expected: true },
      { role: "STAFF", action: "manage_vehicle", expected: false },
      { role: "STAFF", action: "manage_route", expected: false },
      { role: "STAFF", action: "manage_driver", expected: false },
      { role: "STAFF", action: "read_school", expected: true },
      // TEACHER can record boarding but not manage
      { role: "TEACHER", action: "record_boarding", expected: true },
      { role: "TEACHER", action: "manage_assignment", expected: false },
      { role: "TEACHER", action: "manage_vehicle", expected: false },
      // STUDENT and GUARDIAN can read_own only
      { role: "STUDENT", action: "read_own", expected: true },
      { role: "STUDENT", action: "read_school", expected: false },
      { role: "GUARDIAN", action: "read_own", expected: true },
      { role: "GUARDIAN", action: "manage_assignment", expected: false },
      // ACCOUNTANT can view fees
      { role: "ACCOUNTANT", action: "view_fees", expected: true },
      { role: "ACCOUNTANT", action: "manage_vehicle", expected: false },
      // USER (no school) is denied for all transportation actions
      { role: "USER", action: "read_school", expected: false },
      { role: "USER", action: "read_own", expected: false },
    ]

    for (const c of cases) {
      it(`${c.role} → ${c.action} = ${c.expected}`, () => {
        expect(
          checkTransportationPermission(
            { userId: USER_ID, role: c.role, schoolId: SCHOOL_ID },
            c.action
          )
        ).toBe(c.expected)
      })
    }
  })

  describe("Convenience helpers", () => {
    it("canManageVehicles", () => {
      expect(canManageVehicles("ADMIN")).toBe(true)
      expect(canManageVehicles("DEVELOPER")).toBe(true)
      expect(canManageVehicles("STAFF")).toBe(false)
      expect(canManageVehicles("TEACHER")).toBe(false)
    })

    it("canManageRoutes", () => {
      expect(canManageRoutes("ADMIN")).toBe(true)
      expect(canManageRoutes("STAFF")).toBe(false)
    })

    it("canManageDrivers", () => {
      expect(canManageDrivers("ADMIN")).toBe(true)
      expect(canManageDrivers("STAFF")).toBe(false)
    })

    it("canManageAssignments", () => {
      expect(canManageAssignments("ADMIN")).toBe(true)
      expect(canManageAssignments("STAFF")).toBe(true)
      expect(canManageAssignments("TEACHER")).toBe(false)
    })

    it("canReadAllAssignments", () => {
      expect(canReadAllAssignments("ADMIN")).toBe(true)
      expect(canReadAllAssignments("STAFF")).toBe(true)
      expect(canReadAllAssignments("STUDENT")).toBe(false)
    })

    it("canViewFees", () => {
      expect(canViewFees("ADMIN")).toBe(true)
      expect(canViewFees("ACCOUNTANT")).toBe(true)
      expect(canViewFees("STAFF")).toBe(false)
    })
  })

  describe("Role group constants", () => {
    it("ADMIN_ROLES = [DEVELOPER, ADMIN]", () => {
      expect(ADMIN_ROLES).toEqual(["DEVELOPER", "ADMIN"])
    })

    it("STAFF_ROLES includes DEVELOPER, ADMIN, STAFF", () => {
      expect(STAFF_ROLES).toContain("DEVELOPER")
      expect(STAFF_ROLES).toContain("ADMIN")
      expect(STAFF_ROLES).toContain("STAFF")
    })
  })
})
