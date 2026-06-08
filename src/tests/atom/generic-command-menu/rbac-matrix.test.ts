// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * RBAC matrix smoke tests for spotlight predicate builders.
 *
 * Each test asserts the shape of the returned `where` clause for a given
 * (role × kind) cell — denied roles get `null`, scoped roles always carry
 * the matching `userId` constraint, and every permitted role's predicate
 * embeds `schoolId` (the cross-tenant guard).
 */
import { describe, expect, it } from "vitest"

import {
  announcementWhere,
  applicationWhere,
  bookWhere,
  buildEntityKindList,
  classroomWhere,
  classWhere,
  driverWhere,
  eventWhere,
  guardianWhere,
  invoiceWhere,
  paymentWhere,
  routeWhere,
  studentWhere,
  subjectWhere,
  teacherWhere,
  vehicleWhere,
  type PredicateCtx,
} from "@/components/atom/generic-command-menu/server/rbac-predicates"
import type {
  Role,
  SpotlightGroupKind,
} from "@/components/atom/generic-command-menu/types"

const ALL_KINDS: SpotlightGroupKind[] = [
  "student",
  "teacher",
  "guardian",
  "class",
  "classroom",
  "subject",
  "vehicle",
  "driver",
  "route",
  "application",
  "payment",
  "invoice",
  "book",
  "announcement",
  "event",
]

const ALL_ROLES: Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

const ctx = (role: Role): PredicateCtx => ({
  schoolId: "school-A",
  userId: "user-1",
  role,
  search: "ahm",
})

describe("buildEntityKindList", () => {
  it("returns empty for USER role", () => {
    expect(buildEntityKindList("USER", ALL_KINDS)).toEqual([])
  })

  it("returns ALL_KINDS for DEVELOPER and ADMIN", () => {
    for (const role of ["DEVELOPER", "ADMIN"] as Role[]) {
      expect(buildEntityKindList(role, ALL_KINDS).sort()).toEqual(
        [...ALL_KINDS].sort()
      )
    }
  })

  it("STUDENT can search self/guardians/classes/subject/announcement/book/event", () => {
    const allowed = buildEntityKindList("STUDENT", ALL_KINDS)
    expect(allowed).toContain("student")
    expect(allowed).toContain("guardian")
    expect(allowed).toContain("class")
    expect(allowed).toContain("announcement")
    expect(allowed).toContain("book")
    expect(allowed).toContain("event")
    expect(allowed).toContain("subject")
    expect(allowed).not.toContain("teacher")
    expect(allowed).not.toContain("payment")
    expect(allowed).not.toContain("invoice")
    expect(allowed).not.toContain("vehicle")
  })

  it("GUARDIAN can search children/classes/subject/announcement/book/event", () => {
    const allowed = buildEntityKindList("GUARDIAN", ALL_KINDS)
    expect(allowed).toContain("student")
    expect(allowed).toContain("class")
    expect(allowed).toContain("announcement")
    expect(allowed).toContain("event")
    expect(allowed).not.toContain("teacher")
    expect(allowed).not.toContain("payment")
    expect(allowed).not.toContain("invoice")
    expect(allowed).not.toContain("guardian")
  })

  it("ACCOUNTANT can search finance entities but not teachers", () => {
    const allowed = buildEntityKindList("ACCOUNTANT", ALL_KINDS)
    expect(allowed).toContain("payment")
    expect(allowed).toContain("invoice")
    expect(allowed).toContain("application")
    expect(allowed).toContain("student")
    expect(allowed).not.toContain("teacher")
  })

  it("TEACHER can search students/teachers (self)/guardians/classes/classroom", () => {
    const allowed = buildEntityKindList("TEACHER", ALL_KINDS)
    expect(allowed).toContain("student")
    expect(allowed).toContain("teacher")
    expect(allowed).toContain("guardian")
    expect(allowed).toContain("class")
    expect(allowed).toContain("classroom")
    expect(allowed).not.toContain("payment")
    expect(allowed).not.toContain("vehicle")
  })

  it("respects requested filter (kinds: ['student'] returns only student)", () => {
    expect(buildEntityKindList("ADMIN", ["student"])).toEqual(["student"])
    expect(buildEntityKindList("STUDENT", ["student"])).toEqual(["student"])
    expect(buildEntityKindList("ACCOUNTANT", ["teacher"])).toEqual([])
  })
})

describe("studentWhere", () => {
  it("returns null for USER role", () => {
    expect(studentWhere(ctx("USER"))).toBeNull()
  })

  it("ADMIN gets school-scoped predicate (no userId)", () => {
    const where = studentWhere(ctx("ADMIN"))
    expect(where).toBeTruthy()
    expect(where!.schoolId).toBe("school-A")
    expect((where as { userId?: string }).userId).toBeUndefined()
  })

  it("STUDENT gets self-only predicate (userId equals)", () => {
    const where = studentWhere(ctx("STUDENT"))
    expect(where).toBeTruthy()
    expect(where!.schoolId).toBe("school-A")
    expect(where!.userId).toBe("user-1")
  })

  it("GUARDIAN narrows to children only via studentGuardians", () => {
    const where = studentWhere(ctx("GUARDIAN"))
    expect(where).toBeTruthy()
    expect(where!.schoolId).toBe("school-A")
    expect(where!.studentGuardians).toBeDefined()
  })

  it("TEACHER narrows to students in own classes", () => {
    const where = studentWhere(ctx("TEACHER"))
    expect(where).toBeTruthy()
    expect(where!.schoolId).toBe("school-A")
    expect(where!.studentClasses).toBeDefined()
  })
})

describe("teacherWhere", () => {
  it("returns null for STUDENT and GUARDIAN (privacy)", () => {
    expect(teacherWhere(ctx("STUDENT"))).toBeNull()
    expect(teacherWhere(ctx("GUARDIAN"))).toBeNull()
    expect(teacherWhere(ctx("ACCOUNTANT"))).toBeNull()
    expect(teacherWhere(ctx("USER"))).toBeNull()
  })

  it("TEACHER sees only self", () => {
    const where = teacherWhere(ctx("TEACHER"))
    expect(where!.userId).toBe("user-1")
  })

  it("ADMIN/STAFF see school-wide", () => {
    for (const role of ["ADMIN", "STAFF", "DEVELOPER"] as Role[]) {
      const where = teacherWhere(ctx(role))
      expect(where).toBeTruthy()
      expect(where!.schoolId).toBe("school-A")
      expect((where as { userId?: string }).userId).toBeUndefined()
    }
  })
})

describe("guardianWhere", () => {
  it("STUDENT sees own guardians only", () => {
    const where = guardianWhere(ctx("STUDENT"))
    expect(where!.studentGuardians).toBeDefined()
  })

  it("GUARDIAN sees self only", () => {
    const where = guardianWhere(ctx("GUARDIAN"))
    expect(where!.userId).toBe("user-1")
  })

  it("USER is denied", () => {
    expect(guardianWhere(ctx("USER"))).toBeNull()
  })
})

describe("classWhere", () => {
  it("STUDENT sees own classes", () => {
    const where = classWhere(ctx("STUDENT"))
    expect(where!.studentClasses).toBeDefined()
  })

  it("GUARDIAN sees children's classes", () => {
    const where = classWhere(ctx("GUARDIAN"))
    expect(where!.studentClasses).toBeDefined()
  })

  it("TEACHER sees only own classes", () => {
    const where = classWhere(ctx("TEACHER"))
    expect((where as { teacher?: { userId: string } }).teacher).toEqual({
      userId: "user-1",
    })
  })

  it("ACCOUNTANT is denied (not in role list)", () => {
    expect(classWhere(ctx("ACCOUNTANT"))).toBeNull()
  })
})

describe("classroomWhere", () => {
  it("STUDENT/GUARDIAN/ACCOUNTANT denied", () => {
    expect(classroomWhere(ctx("STUDENT"))).toBeNull()
    expect(classroomWhere(ctx("GUARDIAN"))).toBeNull()
    expect(classroomWhere(ctx("ACCOUNTANT"))).toBeNull()
  })
  it("TEACHER/STAFF/ADMIN allowed", () => {
    for (const role of ["TEACHER", "STAFF", "ADMIN", "DEVELOPER"] as Role[]) {
      expect(classroomWhere(ctx(role))).toBeTruthy()
    }
  })
})

describe("subjectWhere", () => {
  it("USER denied", () => {
    expect(subjectWhere(ctx("USER"))).toBeNull()
  })
  it("every other role allowed (catalog is shared)", () => {
    const otherRoles: Role[] = [
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "ACCOUNTANT",
      "STAFF",
    ]
    for (const role of otherRoles) {
      expect(subjectWhere(ctx(role))).toBeTruthy()
    }
  })
})

describe("paymentWhere / invoiceWhere — finance gate", () => {
  const financeAllowed: Role[] = ["DEVELOPER", "ADMIN", "ACCOUNTANT"]
  const financeDenied: Role[] = [
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "STAFF",
    "USER",
  ]

  it("only finance roles can read payments", () => {
    for (const r of financeAllowed) expect(paymentWhere(ctx(r))).toBeTruthy()
    for (const r of financeDenied) expect(paymentWhere(ctx(r))).toBeNull()
  })

  it("only finance roles can read invoices", () => {
    for (const r of financeAllowed) expect(invoiceWhere(ctx(r))).toBeTruthy()
    for (const r of financeDenied) expect(invoiceWhere(ctx(r))).toBeNull()
  })

  it("payment/invoice predicates always carry schoolId", () => {
    const p = paymentWhere(ctx("ADMIN"))
    expect(p!.schoolId).toBe("school-A")
    const i = invoiceWhere(ctx("ADMIN"))
    expect(i!.schoolId).toBe("school-A")
  })
})

describe("transportation predicates", () => {
  it("driverWhere only for STAFF/ADMIN/DEVELOPER", () => {
    expect(driverWhere(ctx("ADMIN"))).toBeTruthy()
    expect(driverWhere(ctx("STAFF"))).toBeTruthy()
    expect(driverWhere(ctx("DEVELOPER"))).toBeTruthy()
    expect(driverWhere(ctx("STUDENT"))).toBeNull()
    expect(driverWhere(ctx("GUARDIAN"))).toBeNull()
    expect(driverWhere(ctx("ACCOUNTANT"))).toBeNull()
  })

  it("vehicle/route also allow ACCOUNTANT (fee assignments use them)", () => {
    expect(vehicleWhere(ctx("ACCOUNTANT"))).toBeTruthy()
    expect(routeWhere(ctx("ACCOUNTANT"))).toBeTruthy()
  })

  it("all transportation predicates filter deletedAt is null", () => {
    expect(driverWhere(ctx("ADMIN"))!.deletedAt).toBeNull()
    expect(vehicleWhere(ctx("ADMIN"))!.deletedAt).toBeNull()
    expect(routeWhere(ctx("ADMIN"))!.deletedAt).toBeNull()
  })
})

describe("application/announcement/event/book — universal-ish", () => {
  it("application requires staff or accountant", () => {
    expect(applicationWhere(ctx("ADMIN"))).toBeTruthy()
    expect(applicationWhere(ctx("STAFF"))).toBeTruthy()
    expect(applicationWhere(ctx("ACCOUNTANT"))).toBeTruthy()
    expect(applicationWhere(ctx("STUDENT"))).toBeNull()
    expect(applicationWhere(ctx("GUARDIAN"))).toBeNull()
  })

  it("announcement filtered to published only", () => {
    expect(announcementWhere(ctx("STUDENT"))!.published).toBe(true)
    expect(announcementWhere(ctx("GUARDIAN"))!.published).toBe(true)
  })

  it("USER denied for all universal-ish kinds", () => {
    expect(applicationWhere(ctx("USER"))).toBeNull()
    expect(announcementWhere(ctx("USER"))).toBeNull()
    expect(eventWhere(ctx("USER"))).toBeNull()
    expect(bookWhere(ctx("USER"))).toBeNull()
  })

  it("every authenticated school role can search announcements/events/books", () => {
    const roles: Role[] = [
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "ACCOUNTANT",
      "STAFF",
    ]
    for (const role of roles) {
      expect(announcementWhere(ctx(role))).toBeTruthy()
      expect(eventWhere(ctx(role))).toBeTruthy()
      expect(bookWhere(ctx(role))).toBeTruthy()
    }
  })
})

describe("cross-tenant safety", () => {
  it("every non-null predicate carries schoolId", () => {
    const builders = [
      studentWhere,
      teacherWhere,
      guardianWhere,
      classWhere,
      classroomWhere,
      announcementWhere,
      eventWhere,
      bookWhere,
      vehicleWhere,
      driverWhere,
      routeWhere,
      applicationWhere,
      paymentWhere,
      invoiceWhere,
    ]
    // ADMIN sees every kind — every builder should embed schoolId.
    for (const fn of builders) {
      const where = fn(ctx("ADMIN"))
      expect(where).toBeTruthy()
      expect((where as { schoolId?: string }).schoolId).toBe("school-A")
    }
  })

  it("schoolId in cache key would never collide between tenants", () => {
    const a = studentWhere({ ...ctx("ADMIN"), schoolId: "school-A" })
    const b = studentWhere({ ...ctx("ADMIN"), schoolId: "school-B" })
    expect(a!.schoolId).toBe("school-A")
    expect(b!.schoolId).toBe("school-B")
  })
})
