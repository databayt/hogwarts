"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  endAssignmentSchema,
  routeAssignmentSchema,
  routeAssignmentUpdateSchema,
  type EndAssignmentInput,
  type RouteAssignmentServerInput,
  type RouteAssignmentUpdateInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

function toDateOrUndefined(value: string | undefined | null) {
  return value ? new Date(value) : undefined
}

export async function assignStudentToRoute(input: RouteAssignmentServerInput) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeAssignmentSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    // Validate refs all belong to the same school
    const [student, route, stop] = await Promise.all([
      db.student.findFirst({
        where: { id: data.studentId, schoolId },
        select: { id: true },
      }),
      db.route.findFirst({
        where: { id: data.routeId, schoolId, deletedAt: null },
        select: { id: true },
      }),
      db.routeStop.findFirst({
        where: { id: data.stopId, schoolId, routeId: data.routeId },
        select: { id: true },
      }),
    ])
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)
    if (!stop) return actionError(ACTION_ERRORS.STOP_NOT_FOUND)

    // Active assignment already exists for this student on this route?
    const existingActive = await db.routeAssignment.findFirst({
      where: {
        schoolId,
        studentId: data.studentId,
        routeId: data.routeId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true },
    })
    if (existingActive) {
      return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_OVERLAP)
    }

    const assignment = await db.routeAssignment.create({
      data: {
        schoolId,
        studentId: data.studentId,
        routeId: data.routeId,
        stopId: data.stopId,
        direction: data.direction,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: toDateOrUndefined(data.effectiveTo),
        status: data.status,
        notes: data.notes,
      },
    })

    revalidatePath(transportationRevalidatePath("assignments"))
    revalidatePath(transportationRevalidatePath(`routes/${data.routeId}`))
    return { success: true as const, data: assignment }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_CREATE_FAILED)
  }
}

export async function updateAssignment(input: RouteAssignmentUpdateInput) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeAssignmentUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, ...data } = parsed.data

  try {
    const current = await db.routeAssignment.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, routeId: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)

    if (data.stopId) {
      const stop = await db.routeStop.findFirst({
        where: { id: data.stopId, schoolId, routeId: current.routeId },
        select: { id: true },
      })
      if (!stop) return actionError(ACTION_ERRORS.STOP_NOT_FOUND)
    }

    const updated = await db.routeAssignment.update({
      where: { id },
      data: {
        ...data,
        effectiveTo: toDateOrUndefined(data.effectiveTo),
      },
    })

    revalidatePath(transportationRevalidatePath("assignments"))
    revalidatePath(transportationRevalidatePath(`routes/${current.routeId}`))
    return { success: true as const, data: updated }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_UPDATE_FAILED)
  }
}

export async function endAssignment(input: EndAssignmentInput) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = endAssignmentSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, endDate } = parsed.data

  try {
    const current = await db.routeAssignment.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, routeId: true, status: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)

    const updated = await db.routeAssignment.update({
      where: { id },
      data: {
        status: "ENDED",
        effectiveTo: endDate ? new Date(endDate) : new Date(),
      },
    })

    revalidatePath(transportationRevalidatePath("assignments"))
    revalidatePath(transportationRevalidatePath(`routes/${current.routeId}`))
    return { success: true as const, data: updated }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_END_FAILED)
  }
}

export async function listAssignments(filters?: {
  routeId?: string
  studentId?: string
  status?: "ACTIVE" | "PAUSED" | "ENDED"
}) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const assignments = await db.routeAssignment.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...(filters?.studentId && { studentId: filters.studentId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        route: { select: { id: true, name: true, code: true } },
        stop: { select: { id: true, name: true, stopOrder: true } },
      },
      orderBy: [{ status: "asc" }, { effectiveFrom: "desc" }],
    })
    return { success: true as const, data: assignments }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getAssignment(id: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const assignment = await db.routeAssignment.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        route: { select: { id: true, name: true, code: true } },
        stop: { select: { id: true, name: true, stopOrder: true } },
      },
    })
    if (!assignment)
      return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)
    return { success: true as const, data: assignment }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Get the active assignment for a student. Used by guardian/student views
 * to surface "your bus" without exposing other students' data.
 */
export async function getAssignmentForStudent(studentId: string) {
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const assignment = await db.routeAssignment.findFirst({
      where: {
        schoolId,
        studentId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        route: {
          include: {
            vehicle: { select: { id: true, plateNumber: true } },
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        stop: true,
      },
    })
    return { success: true as const, data: assignment }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function restoreAssignment(id: string) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.routeAssignment.findFirst({
      where: { id, schoolId },
      select: { id: true, deletedAt: true, studentId: true, routeId: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)
    if (!current.deletedAt) return { success: true as const, data: { id } }

    // Block restore if there's already a non-deleted active assignment for the same student+route
    const conflict = await db.routeAssignment.findFirst({
      where: {
        schoolId,
        studentId: current.studentId,
        routeId: current.routeId,
        status: "ACTIVE",
        deletedAt: null,
        NOT: { id },
      },
      select: { id: true },
    })
    if (conflict) return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_OVERLAP)

    await db.routeAssignment.update({
      where: { id },
      data: { deletedAt: null },
    })

    revalidatePath(transportationRevalidatePath("assignments"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_UPDATE_FAILED)
  }
}

/**
 * Lightweight student lookup used by the assignment form. Permission-gated
 * so direct Prisma reads in the page-level server component don't bypass the
 * RBAC matrix. Returns minimal fields needed for the picker.
 */
export async function listStudentsForAssignment() {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const students = await db.student.findMany({
      where: { schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
    return { success: true as const, data: students }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Lightweight stop lookup used by the assignment form. Permission-gated.
 */
export async function listRouteStopsForAssignment() {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const stops = await db.routeStop.findMany({
      where: { schoolId },
      select: {
        id: true,
        routeId: true,
        name: true,
        stopOrder: true,
      },
      orderBy: [{ routeId: "asc" }, { stopOrder: "asc" }],
    })
    return { success: true as const, data: stops }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
