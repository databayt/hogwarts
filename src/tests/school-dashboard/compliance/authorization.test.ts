// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  checkCompliancePermission,
  type AuthContext,
  type ComplianceAction,
} from "@/components/school-dashboard/compliance/authorization"

const ctx = (role: UserRole, schoolId: string | null = "s1"): AuthContext => ({
  userId: "u1",
  role,
  schoolId,
})

const ALL_ACTIONS: ComplianceAction[] = [
  "manage_config",
  "manage_credentials",
  "view_submissions",
  "retry_submission",
  "download_artifact",
  "manage_shared_groups",
]

describe("compliance authorization", () => {
  describe("DEVELOPER", () => {
    it("can do everything", () => {
      for (const action of ALL_ACTIONS) {
        expect(checkCompliancePermission(ctx("DEVELOPER"), action)).toBe(true)
      }
    })

    it("is the ONLY role that can manage_shared_groups (DEVELOPER-only)", () => {
      expect(
        checkCompliancePermission(ctx("DEVELOPER"), "manage_shared_groups")
      ).toBe(true)
      expect(
        checkCompliancePermission(ctx("ADMIN"), "manage_shared_groups")
      ).toBe(false)
      expect(
        checkCompliancePermission(ctx("STAFF"), "manage_shared_groups")
      ).toBe(false)
    })
  })

  describe("ADMIN", () => {
    it("can manage_config, manage_credentials, retry_submission", () => {
      expect(checkCompliancePermission(ctx("ADMIN"), "manage_config")).toBe(
        true
      )
      expect(
        checkCompliancePermission(ctx("ADMIN"), "manage_credentials")
      ).toBe(true)
      expect(checkCompliancePermission(ctx("ADMIN"), "retry_submission")).toBe(
        true
      )
    })

    it("can view + download", () => {
      expect(checkCompliancePermission(ctx("ADMIN"), "view_submissions")).toBe(
        true
      )
      expect(checkCompliancePermission(ctx("ADMIN"), "download_artifact")).toBe(
        true
      )
    })

    it("cannot manage_shared_groups (DEVELOPER only)", () => {
      expect(
        checkCompliancePermission(ctx("ADMIN"), "manage_shared_groups")
      ).toBe(false)
    })
  })

  describe("STAFF", () => {
    it("can view_submissions and download_artifact (read-only access)", () => {
      expect(checkCompliancePermission(ctx("STAFF"), "view_submissions")).toBe(
        true
      )
      expect(checkCompliancePermission(ctx("STAFF"), "download_artifact")).toBe(
        true
      )
    })

    it("cannot manage config, credentials, retry, or shared groups", () => {
      expect(checkCompliancePermission(ctx("STAFF"), "manage_config")).toBe(
        false
      )
      expect(
        checkCompliancePermission(ctx("STAFF"), "manage_credentials")
      ).toBe(false)
      expect(checkCompliancePermission(ctx("STAFF"), "retry_submission")).toBe(
        false
      )
      expect(
        checkCompliancePermission(ctx("STAFF"), "manage_shared_groups")
      ).toBe(false)
    })
  })

  describe("non-staff roles (TEACHER, STUDENT, GUARDIAN)", () => {
    it.each(["TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "USER"] as const)(
      "%s gets denied on every action",
      (role) => {
        for (const action of ALL_ACTIONS) {
          expect(checkCompliancePermission(ctx(role as UserRole), action)).toBe(
            false
          )
        }
      }
    )
  })
})
