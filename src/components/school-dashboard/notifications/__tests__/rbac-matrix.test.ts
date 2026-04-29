// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exhaustive RBAC matrix: every UserRole × NotificationType combination.
 *
 * Why this exists: the previous getAllowedNotificationTypes() shipped a
 * hard-coded list that drifted from the Prisma enum (missed setup_guide,
 * absence_intention, absence_intention_decision). This test asserts the full
 * matrix so any future enum change must be paired with an authorization
 * decision, not silently allowed/denied.
 */

import { NotificationType, UserRole } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  canSendNotificationType,
  checkNotificationPermission,
  getAllowedNotificationTypes,
} from "../authorization"

const ALL_ROLES = Object.values(UserRole)
const ALL_TYPES = Object.values(NotificationType)

describe("RBAC matrix — UserRole × NotificationType", () => {
  it("covers every Prisma role", () => {
    expect(ALL_ROLES).toContain("DEVELOPER")
    expect(ALL_ROLES).toContain("ADMIN")
    expect(ALL_ROLES).toContain("TEACHER")
    expect(ALL_ROLES).toContain("STUDENT")
    expect(ALL_ROLES).toContain("GUARDIAN")
    expect(ALL_ROLES).toContain("ACCOUNTANT")
    expect(ALL_ROLES).toContain("STAFF")
    expect(ALL_ROLES).toContain("USER")
  })

  it("covers every Prisma notification type (24+)", () => {
    expect(ALL_TYPES.length).toBeGreaterThanOrEqual(24)
    expect(ALL_TYPES).toContain("setup_guide")
    expect(ALL_TYPES).toContain("absence_intention")
    expect(ALL_TYPES).toContain("absence_intention_decision")
  })

  describe("canSendNotificationType", () => {
    it("DEVELOPER and ADMIN can send every type", () => {
      for (const type of ALL_TYPES) {
        expect(canSendNotificationType("DEVELOPER", type)).toBe(true)
        expect(canSendNotificationType("ADMIN", type)).toBe(true)
      }
    })

    it("STUDENT, GUARDIAN, USER cannot send any type", () => {
      for (const role of ["STUDENT", "GUARDIAN", "USER"] as const) {
        for (const type of ALL_TYPES) {
          expect(canSendNotificationType(role, type)).toBe(false)
        }
      }
    })

    it("TEACHER allow-list is exact (academic only)", () => {
      const expected = new Set([
        "assignment_created",
        "assignment_due",
        "assignment_graded",
        "grade_posted",
        "attendance_marked",
        "class_cancelled",
        "class_rescheduled",
      ])
      for (const type of ALL_TYPES) {
        expect(canSendNotificationType("TEACHER", type)).toBe(
          expected.has(type)
        )
      }
    })

    it("ACCOUNTANT allow-list is exact (fee only)", () => {
      const expected = new Set(["fee_due", "fee_overdue", "fee_paid"])
      for (const type of ALL_TYPES) {
        expect(canSendNotificationType("ACCOUNTANT", type)).toBe(
          expected.has(type)
        )
      }
    })

    it("STAFF allow-list is exact (operational only)", () => {
      const expected = new Set(["document_shared", "event_reminder"])
      for (const type of ALL_TYPES) {
        expect(canSendNotificationType("STAFF", type)).toBe(expected.has(type))
      }
    })
  })

  describe("getAllowedNotificationTypes", () => {
    it("DEVELOPER returns the full Prisma enum (no drift)", () => {
      const allowed = getAllowedNotificationTypes("DEVELOPER")
      expect(allowed.length).toBe(ALL_TYPES.length)
      for (const type of ALL_TYPES) {
        expect(allowed).toContain(type)
      }
    })

    it("ADMIN returns the full Prisma enum (no drift)", () => {
      const allowed = getAllowedNotificationTypes("ADMIN")
      expect(allowed.length).toBe(ALL_TYPES.length)
      for (const type of ALL_TYPES) {
        expect(allowed).toContain(type)
      }
    })

    it("non-privileged roles do not include privileged-only types", () => {
      const privilegedOnly = ["system_alert", "account_created", "login_alert"]
      for (const role of [
        "TEACHER",
        "STUDENT",
        "GUARDIAN",
        "ACCOUNTANT",
        "STAFF",
        "USER",
      ] as const) {
        const allowed = getAllowedNotificationTypes(role)
        for (const type of privilegedOnly) {
          expect(allowed).not.toContain(type)
        }
      }
    })
  })

  describe("checkNotificationPermission — read/delete on own", () => {
    const ownerId = "self-1"
    const otherId = "other-2"

    for (const role of ALL_ROLES) {
      it(`${role} can read own notification`, () => {
        const auth = { userId: ownerId, role, schoolId: "school-1" }
        expect(
          checkNotificationPermission(auth, "read", { userId: ownerId })
        ).toBe(true)
      })

      it(`${role} can delete own notification`, () => {
        const auth = { userId: ownerId, role, schoolId: "school-1" }
        expect(
          checkNotificationPermission(auth, "delete", { userId: ownerId })
        ).toBe(true)
      })
    }

    // Only DEVELOPER bypasses the owner check
    for (const role of ALL_ROLES) {
      const isDev = role === "DEVELOPER"
      it(`${role} ${isDev ? "can" : "cannot"} read others' notification`, () => {
        const auth = { userId: ownerId, role, schoolId: "school-1" }
        expect(
          checkNotificationPermission(auth, "read", { userId: otherId })
        ).toBe(isDev)
      })
    }
  })
})
