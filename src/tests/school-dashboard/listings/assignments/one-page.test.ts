// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { isRouteAllowedForRole, type Role } from "@/routes"
import { formatAssignmentDate } from "@/components/school-dashboard/listings/assignments/date"
import { assignmentsViewForRole } from "@/components/school-dashboard/listings/assignments/view"
import { pickChild } from "@/components/school-dashboard/listings/assignments/access"
import {
  enumKey,
  statusLabel,
  typeLabel,
} from "@/components/school-dashboard/listings/assignments/labels"

const ALL: Role[] = [
  "ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "USER",
  "DEVELOPER",
]
const allowed = (path: string) => ALL.filter((r) => isRouteAllowedForRole(path, r))

describe("routes: one role-based /assignments", () => {
  const family = ["ADMIN", "TEACHER", "STAFF", "STUDENT", "GUARDIAN", "DEVELOPER"]

  it("opens the list and the detail to staff, students and guardians", () => {
    expect(allowed("/assignments").sort()).toEqual([...family].sort())
    expect(allowed("/assignments/cm123").sort()).toEqual([...family].sort())
  })

  it("keeps the create/edit wizard staff-only (the longer wildcard wins)", () => {
    const staff = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
    expect(allowed("/assignments/add/x/information").sort()).toEqual(staff.sort())
    expect(allowed("/assignments/add/x/details")).not.toContain("STUDENT")
    expect(allowed("/assignments/add/x/details")).not.toContain("GUARDIAN")
  })

  it("no longer gates /my-assignments (it is only a redirect now)", () => {
    expect(allowed("/my-assignments").sort()).toEqual([...ALL].sort())
  })
})

describe("the role switch", () => {
  it("picks the right view for each role", () => {
    expect(assignmentsViewForRole("ADMIN")).toBe("staff")
    expect(assignmentsViewForRole("TEACHER")).toBe("staff")
    expect(assignmentsViewForRole("STAFF")).toBe("staff")
    expect(assignmentsViewForRole("PRINCIPAL")).toBe("staff")
    expect(assignmentsViewForRole("DEVELOPER")).toBe("staff")
    expect(assignmentsViewForRole("STUDENT")).toBe("student")
    expect(assignmentsViewForRole("GUARDIAN")).toBe("guardian")
    expect(assignmentsViewForRole("ACCOUNTANT")).toBe("none")
    expect(assignmentsViewForRole("USER")).toBe("none")
    expect(assignmentsViewForRole(null)).toBe("none")
    expect(assignmentsViewForRole(undefined)).toBe("none")
  })
})

describe("formatAssignmentDate", () => {
  const d = new Date("2026-11-17T12:00:00Z")

  it("is Gregorian in Arabic — never the Hijri year", () => {
    const out = formatAssignmentDate(d, "ar")
    expect(out).toMatch(/٢٠٢٦|2026/)
    expect(out).not.toMatch(/١٤[٤٣]\d|144\d|هـ/)
  })

  it("is Gregorian in English and one format everywhere", () => {
    expect(formatAssignmentDate(d, "en")).toBe("17 Nov 2026")
    expect(formatAssignmentDate(d, "en", "long")).toBe("17 November 2026")
    expect(formatAssignmentDate(d.toISOString(), "en")).toBe("17 Nov 2026")
  })

  it("returns an empty string for nothing or garbage", () => {
    expect(formatAssignmentDate(null, "ar")).toBe("")
    expect(formatAssignmentDate("nope", "en")).toBe("")
  })
})

describe("enum labels", () => {
  it("maps SCREAMING_SNAKE enums to camelCase dictionary keys", () => {
    expect(enumKey("FINAL_EXAM")).toBe("finalExam")
    expect(enumKey("IN_PROGRESS")).toBe("inProgress")
  })

  it("translates a status instead of showing PUBLISHED raw", () => {
    expect(statusLabel({ published: "منشور" }, "PUBLISHED")).toBe("منشور")
    expect(typeLabel({ homework: "واجب منزلي" }, "HOMEWORK")).toBe("واجب منزلي")
  })

  it("falls back to the raw value only when the dictionary has no key", () => {
    expect(typeLabel({}, "ESSAY")).toBe("ESSAY")
  })
})

describe("pickChild", () => {
  const kids = [{ id: "a" }, { id: "b" }]
  it("honours ?child= and defaults to the first", () => {
    expect(pickChild(kids, "b")?.id).toBe("b")
    expect(pickChild(kids, "")?.id).toBe("a")
    expect(pickChild(kids, "someone-elses")?.id).toBe("a")
    expect(pickChild([], "a")).toBeNull()
  })
})
