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
