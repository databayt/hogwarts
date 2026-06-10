// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { Prisma } from "@prisma/client"

import type { Role, SpotlightGroupKind } from "../types"

/**
 * Context passed to every per-kind where builder. The `search` value is the
 * already-normalized substring — no `%` wildcards (Prisma `contains` adds
 * them) and no leading/trailing whitespace.
 */
export interface PredicateCtx {
  schoolId: string
  userId: string
  role: Role
  search: string
}

const ADMIN_ROLES: Role[] = ["DEVELOPER", "ADMIN"]
const STAFF_VIEW: Role[] = ["DEVELOPER", "ADMIN", "STAFF"]
const FINANCE_ROLES: Role[] = ["DEVELOPER", "ADMIN", "ACCOUNTANT"]
const ACADEMIC_VIEW: Role[] = ["DEVELOPER", "ADMIN", "STAFF", "TEACHER"]

/**
 * Decide which entity kinds this role is allowed to query before building
 * predicates. Returns the intersection of "allowed for this role" and the
 * caller's `requested` list (UI checkboxes / future kind filter).
 *
 * USER role (signed-in but not yet onboarded into a school) sees nothing.
 */
export function buildEntityKindList(
  role: Role,
  requested: readonly SpotlightGroupKind[]
): SpotlightGroupKind[] {
  if (role === "USER") return []

  const allowed = new Set<SpotlightGroupKind>()

  // Universal — every authenticated school member can browse these
  allowed.add("announcement")
  allowed.add("book")
  allowed.add("event")
  allowed.add("subject")

  if (ADMIN_ROLES.includes(role)) {
    // Admins/Developers see everything in their school
    for (const k of requested) allowed.add(k)
  } else if (role === "STAFF") {
    ;[
      "student",
      "teacher",
      "guardian",
      "class",
      "classroom",
      "vehicle",
      "driver",
      "route",
      "application",
    ].forEach((k) => allowed.add(k as SpotlightGroupKind))
  } else if (role === "TEACHER") {
    ;["student", "teacher", "guardian", "class", "classroom"].forEach((k) =>
      allowed.add(k as SpotlightGroupKind)
    )
  } else if (role === "ACCOUNTANT") {
    ;[
      "student",
      "guardian",
      "payment",
      "invoice",
      "application",
      "vehicle",
      "route",
    ].forEach((k) => allowed.add(k as SpotlightGroupKind))
  } else if (role === "STUDENT") {
    ;["student", "guardian", "class"].forEach((k) =>
      allowed.add(k as SpotlightGroupKind)
    )
  } else if (role === "GUARDIAN") {
    ;["student", "class"].forEach((k) => allowed.add(k as SpotlightGroupKind))
  }

  return [...allowed].filter((k) => requested.includes(k))
}

/* ──────────────────────────────────────────────────────────────────── *
 * Per-kind where builders                                              *
 *                                                                      *
 * Every builder hard-codes `schoolId` (cross-tenant guard) and a       *
 * role-specific narrowing predicate. Returning `null` means the role   *
 * cannot search this kind — the orchestrator skips the findMany call.  *
 * ──────────────────────────────────────────────────────────────────── */

export function studentWhere(c: PredicateCtx): Prisma.StudentWhereInput | null {
  const insensitive = Prisma.QueryMode.insensitive
  const search: Prisma.StudentWhereInput = {
    OR: [
      { firstName: { contains: c.search, mode: insensitive } },
      { lastName: { contains: c.search, mode: insensitive } },
      { email: { contains: c.search, mode: insensitive } },
      { studentId: { contains: c.search, mode: insensitive } },
      { grNumber: { contains: c.search, mode: insensitive } },
    ],
  }
  const base: Prisma.StudentWhereInput = {
    schoolId: c.schoolId,
    wizardStep: null,
    ...search,
  }

  if (c.role === "STUDENT") return { ...base, userId: c.userId }
  if (c.role === "GUARDIAN") {
    return {
      ...base,
      studentGuardians: { some: { guardian: { userId: c.userId } } },
    }
  }
  if (c.role === "TEACHER") {
    return {
      ...base,
      studentClasses: { some: { class: { teacher: { userId: c.userId } } } },
    }
  }
  if (
    ADMIN_ROLES.includes(c.role) ||
    c.role === "STAFF" ||
    c.role === "ACCOUNTANT"
  ) {
    return base
  }
  return null
}

export function teacherWhere(c: PredicateCtx): Prisma.TeacherWhereInput | null {
  const insensitive = Prisma.QueryMode.insensitive
  const search: Prisma.TeacherWhereInput = {
    OR: [
      { firstName: { contains: c.search, mode: insensitive } },
      { lastName: { contains: c.search, mode: insensitive } },
      { emailAddress: { contains: c.search, mode: insensitive } },
      { employeeId: { contains: c.search, mode: insensitive } },
    ],
  }
  const base: Prisma.TeacherWhereInput = {
    schoolId: c.schoolId,
    wizardStep: null,
    ...search,
  }

  // STUDENT/GUARDIAN cannot enumerate other teachers (privacy).
  if (c.role === "TEACHER") return { ...base, userId: c.userId }
  if (STAFF_VIEW.includes(c.role)) return base
  return null
}

export function guardianWhere(
  c: PredicateCtx
): Prisma.GuardianWhereInput | null {
  const insensitive = Prisma.QueryMode.insensitive
  const search: Prisma.GuardianWhereInput = {
    OR: [
      { firstName: { contains: c.search, mode: insensitive } },
      { lastName: { contains: c.search, mode: insensitive } },
      { emailAddress: { contains: c.search, mode: insensitive } },
    ],
  }
  const base: Prisma.GuardianWhereInput = {
    schoolId: c.schoolId,
    wizardStep: null,
    ...search,
  }

  if (c.role === "GUARDIAN") return { ...base, userId: c.userId }
  if (c.role === "STUDENT") {
    return {
      ...base,
      studentGuardians: { some: { student: { userId: c.userId } } },
    }
  }
  // Admins/staff/accountant see all guardians in school.
  if (
    ADMIN_ROLES.includes(c.role) ||
    c.role === "STAFF" ||
    c.role === "ACCOUNTANT"
  ) {
    return base
  }
  // Teachers can search guardians of their own students.
  if (c.role === "TEACHER") {
    return {
      ...base,
      studentGuardians: {
        some: {
          student: {
            studentClasses: {
              some: { class: { teacher: { userId: c.userId } } },
            },
          },
        },
      },
    }
  }
  return null
}

export function classWhere(c: PredicateCtx): Prisma.ClassWhereInput | null {
  const insensitive = Prisma.QueryMode.insensitive
  const search: Prisma.ClassWhereInput = {
    OR: [
      { name: { contains: c.search, mode: insensitive } },
      { courseCode: { contains: c.search, mode: insensitive } },
    ],
  }
  const base: Prisma.ClassWhereInput = { schoolId: c.schoolId, ...search }

  if (c.role === "TEACHER") {
    return { ...base, teacher: { userId: c.userId } }
  }
  if (c.role === "STUDENT") {
    return {
      ...base,
      studentClasses: { some: { student: { userId: c.userId } } },
    }
  }
  if (c.role === "GUARDIAN") {
    return {
      ...base,
      studentClasses: {
        some: {
          student: {
            studentGuardians: { some: { guardian: { userId: c.userId } } },
          },
        },
      },
    }
  }
  if (ADMIN_ROLES.includes(c.role) || c.role === "STAFF") return base
  return null
}

export function classroomWhere(
  c: PredicateCtx
): Prisma.ClassroomWhereInput | null {
  if (!ACADEMIC_VIEW.includes(c.role)) return null
  return {
    schoolId: c.schoolId,
    roomName: { contains: c.search, mode: Prisma.QueryMode.insensitive },
  }
}

export function subjectWhere(c: PredicateCtx): Prisma.SubjectWhereInput | null {
  // Subject is a global catalog (no schoolId). All authenticated school
  // members can search it; route to the school's selection page on click.
  // Only PUBLISHED subjects are searchable — DRAFT/REVIEW/ARCHIVED catalog
  // rows must never leak into school-facing search.
  if (c.role === "USER") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    status: "PUBLISHED",
    OR: [
      { name: { contains: c.search, mode: insensitive } },
      { department: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function announcementWhere(
  c: PredicateCtx
): Prisma.AnnouncementWhereInput | null {
  if (c.role === "USER") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    published: true,
    OR: [
      { title: { contains: c.search, mode: insensitive } },
      { body: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function eventWhere(c: PredicateCtx): Prisma.EventWhereInput | null {
  if (c.role === "USER") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    OR: [
      { title: { contains: c.search, mode: insensitive } },
      { location: { contains: c.search, mode: insensitive } },
      { organizer: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function bookWhere(c: PredicateCtx): Prisma.SchoolBookWhereInput | null {
  if (c.role === "USER") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    OR: [
      { title: { contains: c.search, mode: insensitive } },
      { author: { contains: c.search, mode: insensitive } },
      { isbn: { contains: c.search, mode: insensitive } },
      { publisher: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function vehicleWhere(c: PredicateCtx): Prisma.VehicleWhereInput | null {
  if (!STAFF_VIEW.includes(c.role) && c.role !== "ACCOUNTANT") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    deletedAt: null,
    OR: [
      { plateNumber: { contains: c.search, mode: insensitive } },
      { make: { contains: c.search, mode: insensitive } },
      { model: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function driverWhere(c: PredicateCtx): Prisma.DriverWhereInput | null {
  if (!STAFF_VIEW.includes(c.role)) return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    deletedAt: null,
    OR: [
      { firstName: { contains: c.search, mode: insensitive } },
      { lastName: { contains: c.search, mode: insensitive } },
      { phone: { contains: c.search, mode: insensitive } },
      { licenseNumber: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function routeWhere(c: PredicateCtx): Prisma.RouteWhereInput | null {
  if (!STAFF_VIEW.includes(c.role) && c.role !== "ACCOUNTANT") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    deletedAt: null,
    OR: [
      { name: { contains: c.search, mode: insensitive } },
      { code: { contains: c.search, mode: insensitive } },
      { originName: { contains: c.search, mode: insensitive } },
      { destinationName: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function applicationWhere(
  c: PredicateCtx
): Prisma.ApplicationWhereInput | null {
  if (!STAFF_VIEW.includes(c.role) && c.role !== "ACCOUNTANT") return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    OR: [
      { firstName: { contains: c.search, mode: insensitive } },
      { lastName: { contains: c.search, mode: insensitive } },
      { email: { contains: c.search, mode: insensitive } },
      { applicationNumber: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function paymentWhere(c: PredicateCtx): Prisma.PaymentWhereInput | null {
  if (!FINANCE_ROLES.includes(c.role)) return null
  const insensitive = Prisma.QueryMode.insensitive
  return {
    schoolId: c.schoolId,
    OR: [
      { paymentNumber: { contains: c.search, mode: insensitive } },
      { receiptNumber: { contains: c.search, mode: insensitive } },
      { transactionId: { contains: c.search, mode: insensitive } },
    ],
  }
}

export function invoiceWhere(
  c: PredicateCtx
): Prisma.UserInvoiceWhereInput | null {
  if (!FINANCE_ROLES.includes(c.role)) return null
  return {
    schoolId: c.schoolId,
    invoice_no: {
      contains: c.search,
      mode: Prisma.QueryMode.insensitive,
    },
  }
}
