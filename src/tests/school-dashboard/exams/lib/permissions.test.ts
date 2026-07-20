// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  getExamTabsForRole,
  hasPermission,
  type Permission,
  type PermissionContext,
} from "@/components/school-dashboard/exams/lib/permissions"

const ctx = (userRole: string): PermissionContext => ({
  userId: "u1",
  userRole,
  schoolId: "s1",
})

describe("exams/permissions — hasPermission (RBAC matrix)", () => {
  it("DEVELOPER and ADMIN have full access", () => {
    const full: Permission[] = [
      "exam:create",
      "exam:delete",
      "exam:publish",
      "result:delete",
      "result:batch_generate",
      "marking:override",
      "analytics:export",
      "certificate:revoke",
    ]
    for (const role of ["DEVELOPER", "ADMIN"]) {
      for (const p of full) {
        expect(hasPermission(ctx(role), p), `${role} should have ${p}`).toBe(
          true
        )
      }
    }
  })

  it("TEACHER can author exams but not publish/override/revoke/export-analytics", () => {
    const t = ctx("TEACHER")
    expect(hasPermission(t, "exam:create")).toBe(true)
    expect(hasPermission(t, "exam:update")).toBe(true)
    expect(hasPermission(t, "question:create")).toBe(true)
    expect(hasPermission(t, "marking:update")).toBe(true)
    // Privileges reserved for admins:
    expect(hasPermission(t, "exam:publish")).toBe(false)
    expect(hasPermission(t, "result:delete")).toBe(false)
    expect(hasPermission(t, "marking:override")).toBe(false)
    expect(hasPermission(t, "analytics:export")).toBe(false)
    expect(hasPermission(t, "certificate:revoke")).toBe(false)
  })

  it("ACCOUNTANT is read/export-only on results + analytics", () => {
    const a = ctx("ACCOUNTANT")
    expect(hasPermission(a, "result:read")).toBe(true)
    expect(hasPermission(a, "result:export")).toBe(true)
    expect(hasPermission(a, "analytics:export")).toBe(true)
    expect(hasPermission(a, "exam:create")).toBe(false)
    expect(hasPermission(a, "result:update")).toBe(false)
  })

  it("STUDENT can only read (own) exam/result/question/certificate", () => {
    const s = ctx("STUDENT")
    expect(hasPermission(s, "exam:read")).toBe(true)
    expect(hasPermission(s, "result:read")).toBe(true)
    expect(hasPermission(s, "question:read")).toBe(true)
    expect(hasPermission(s, "certificate:read")).toBe(true)
    expect(hasPermission(s, "exam:create")).toBe(false)
    expect(hasPermission(s, "result:update")).toBe(false)
    expect(hasPermission(s, "analytics:read")).toBe(false)
  })

  it("GUARDIAN reads exams/results/certificates but not questions", () => {
    const g = ctx("GUARDIAN")
    expect(hasPermission(g, "result:read")).toBe(true)
    expect(hasPermission(g, "exam:read")).toBe(true)
    expect(hasPermission(g, "certificate:read")).toBe(true)
    expect(hasPermission(g, "question:read")).toBe(false)
    expect(hasPermission(g, "exam:create")).toBe(false)
  })

  it("STAFF has only exam + analytics read", () => {
    const st = ctx("STAFF")
    expect(hasPermission(st, "exam:read")).toBe(true)
    expect(hasPermission(st, "analytics:read")).toBe(true)
    expect(hasPermission(st, "result:read")).toBe(false)
    expect(hasPermission(st, "exam:create")).toBe(false)
  })

  it("an unknown role has no permissions (deny-by-default)", () => {
    const u = ctx("USER")
    expect(hasPermission(u, "exam:read")).toBe(false)
    expect(hasPermission(u, "result:read")).toBe(false)
    expect(hasPermission(u, "exam:create")).toBe(false)
  })
})

describe("exams/permissions — getExamTabsForRole", () => {
  const hrefs = (role: string) =>
    getExamTabsForRole(role, "en").map((t) => t.href)

  it("DEVELOPER/ADMIN/TEACHER get the management tabs (manage + qbank + generate)", () => {
    for (const role of ["DEVELOPER", "ADMIN", "TEACHER"]) {
      const h = hrefs(role)
      expect(h, role).toContain("/en/exams/manage")
      expect(h, role).toContain("/en/exams/qbank")
      expect(h, role).toContain("/en/exams/generate")
      expect(h, role).toContain("/en/exams/mark")
    }
  })

  it("templates tab is staff-only (docx upload + fill is a manager action)", () => {
    for (const role of ["DEVELOPER", "ADMIN", "TEACHER"]) {
      expect(hrefs(role), role).toContain("/en/exams/templates")
    }
    for (const role of ["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "USER"]) {
      expect(hrefs(role), role).not.toContain("/en/exams/templates")
    }
  })

  it("STUDENT gets practice/results but NOT management tabs", () => {
    const h = hrefs("STUDENT")
    expect(h).toContain("/en/exams") // overview
    expect(h).toContain("/en/exams/result")
    expect(h).not.toContain("/en/exams/manage")
    expect(h).not.toContain("/en/exams/generate")
    expect(h).not.toContain("/en/exams/mark")
  })

  it("GUARDIAN gets a minimal read set; ACCOUNTANT gets results; default gets overview only", () => {
    expect(hrefs("GUARDIAN")).not.toContain("/en/exams/manage")
    expect(hrefs("GUARDIAN")).toContain("/en/exams/result")
    expect(hrefs("ACCOUNTANT")).toContain("/en/exams/result")
    expect(hrefs("ACCOUNTANT")).not.toContain("/en/exams/manage")
    // Unknown role → overview only
    const def = hrefs("USER")
    expect(def).toEqual(["/en/exams"])
  })
})
