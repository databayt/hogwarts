"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import {
  transportSkipSchema,
  type TransportSkipInput,
} from "@/components/school-dashboard/transportation/validation"
import { getLabels } from "@/components/translation/person"

import { requireContext, transportationRevalidatePath } from "./helpers"

export interface MyTransportationAssignment {
  id: string
  routeId: string
  routeName: string
  routeCode: string | null
  stopName: string
  stopOrder: number
  direction: string
  status: string
  vehicle: { id: string; plateNumber: string } | null
  driver: {
    id: string
    firstName: string
    lastName: string
    phone: string
  } | null
}

export interface MyTransportationTrip {
  tripId: string
  scheduledDate: Date
  scheduledTime: string
  status: string
  boardingStatus: string | null
}

export interface MyTransportationChild {
  studentId: string
  firstName: string
  lastName: string
  assignments: MyTransportationAssignment[]
  recentTrips: MyTransportationTrip[]
}

/**
 * Returns transportation info scoped to the current STUDENT or GUARDIAN.
 * - STUDENT → array with one element (themselves)
 * - GUARDIAN → array with one element per linked child via StudentGuardian
 *
 * Always schoolId-scoped via getTenantContext().
 */
export async function getMyTransportationView(displayLang?: Locale) {
  // read_own gates STUDENT/GUARDIAN (+ STAFF/TEACHER/DEVELOPER/ADMIN) through
  // the central permission matrix; the role branch below narrows behavior.
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId, role } = ctx

  // Resolve target studentIds based on role
  let studentIds: string[] = []

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    if (student) studentIds = [student.id]
  } else if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    if (guardian) {
      const links = await db.studentGuardian.findMany({
        where: { schoolId, guardianId: guardian.id },
        select: { studentId: true },
      })
      studentIds = links.map((l) => l.studentId)
    }
  } else if (role === "DEVELOPER" || role === "ADMIN") {
    // QA path — return empty list (no impersonation here)
    return { success: true as const, data: [] as MyTransportationChild[] }
  } else {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  if (studentIds.length === 0) {
    return { success: true as const, data: [] as MyTransportationChild[] }
  }

  try {
    const students = await db.student.findMany({
      where: { schoolId, id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        routeAssignments: {
          where: { schoolId, status: "ACTIVE", deletedAt: null },
          select: {
            id: true,
            routeId: true,
            direction: true,
            status: true,
            route: {
              select: {
                name: true,
                code: true,
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
            stop: { select: { name: true, stopOrder: true } },
          },
        },
        tripBoardings: {
          where: { schoolId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            status: true,
            trip: {
              select: {
                id: true,
                scheduledDate: true,
                scheduledTime: true,
                status: true,
              },
            },
          },
        },
      },
    })

    // Route/stop names are stored in one language; translate on demand into
    // the viewer's locale so guardians/students see them localized. ONE
    // batched getLabels resolution for every name across all children
    // (dedupe + cache + source fallback) instead of per-field-per-row calls.
    let labels = new Map<string, string>()
    if (displayLang) {
      const values: Array<string | null | undefined> = []
      for (const s of students) {
        for (const a of s.routeAssignments) {
          values.push(a.route.name, a.stop.name)
        }
      }
      labels = await getLabels(values, displayLang, schoolId)
    }

    const data: MyTransportationChild[] = students.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      assignments: s.routeAssignments.map((a) => ({
        id: a.id,
        routeId: a.routeId,
        routeName: labels.get(a.route.name) ?? a.route.name,
        routeCode: a.route.code,
        stopName: labels.get(a.stop.name) ?? a.stop.name,
        stopOrder: a.stop.stopOrder,
        direction: a.direction,
        status: a.status,
        vehicle: a.route.vehicle ?? null,
        driver: a.route.driver ?? null,
      })),
      recentTrips: s.tripBoardings.map((b) => ({
        tripId: b.trip.id,
        scheduledDate: b.trip.scheduledDate,
        scheduledTime: b.trip.scheduledTime,
        status: b.trip.status,
        boardingStatus: b.status,
      })),
    }))

    return { success: true as const, data }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Resolve the studentIds the current STUDENT/GUARDIAN owns (internal). */
async function resolveOwnedStudentIds(
  schoolId: string,
  userId: string,
  role: UserRole
): Promise<string[]> {
  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    return student ? [student.id] : []
  }
  if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    if (!guardian) return []
    const links = await db.studentGuardian.findMany({
      where: { schoolId, guardianId: guardian.id },
      select: { studentId: true },
    })
    return links.map((l) => l.studentId)
  }
  return []
}

export interface MyTransportSkip {
  id: string
  studentId: string
  dateFrom: string
  dateTo: string
  status: string
}

/** Upcoming transport-skip requests for the current user's student(s). */
export async function getMyTransportSkips() {
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId, role } = ctx
  const studentIds = await resolveOwnedStudentIds(schoolId, userId, role)
  if (studentIds.length === 0) {
    return { success: true as const, data: [] as MyTransportSkip[] }
  }
  try {
    const now = new Date()
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
    const skips = await db.absenceIntention.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        reason: "TRANSPORTATION",
        dateTo: { gte: day },
      },
      orderBy: { dateFrom: "asc" },
      select: {
        id: true,
        studentId: true,
        dateFrom: true,
        dateTo: true,
        status: true,
      },
    })
    return {
      success: true as const,
      data: skips.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        dateFrom: s.dateFrom.toISOString(),
        dateTo: s.dateTo.toISOString(),
        status: s.status,
      })),
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Guardian/student requests to skip pickup for a date range. Creates a PENDING
 * AbsenceIntention(reason=TRANSPORTATION) — an admin must APPROVE before the
 * student is dropped from a run (safety: never auto-removes the seat).
 */
export async function requestTransportSkip(input: TransportSkipInput) {
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId, role } = ctx

  const parsed = transportSkipSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { studentId, dateFrom, dateTo, notes } = parsed.data

  const owned = await resolveOwnedStudentIds(schoolId, userId, role)
  if (!owned.includes(studentId)) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  const to = dateTo ?? dateFrom
  if (to.getTime() < dateFrom.getTime()) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const daysCount = Math.max(
    1,
    Math.round((to.getTime() - dateFrom.getTime()) / 86400000) + 1
  )

  try {
    const skip = await db.absenceIntention.create({
      data: {
        schoolId,
        studentId,
        dateFrom,
        dateTo: to,
        reason: "TRANSPORTATION",
        status: "PENDING",
        submittedBy: userId,
        description: notes ?? null,
        daysCount,
      },
      select: { id: true },
    })
    revalidatePath(transportationRevalidatePath("me"))
    return { success: true as const, data: { id: skip.id } }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

export interface TripMapData {
  stops: Array<{ id: string; name: string; lat: number; lng: number }>
  polylineEncoded: string | null
}

/**
 * Stops + polyline for a trip's live map, for a STUDENT/GUARDIAN. Ownership-gated:
 * the caller must own a student with a boarding on this trip (never an arbitrary
 * trip id).
 */
export async function getTripMapData(tripId: string) {
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId, role } = ctx
  const owned = await resolveOwnedStudentIds(schoolId, userId, role)
  if (owned.length === 0) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  try {
    // Ownership: one of the caller's students must have a boarding on this trip.
    const boarding = await db.tripBoarding.findFirst({
      where: { schoolId, tripId, studentId: { in: owned } },
      select: { id: true },
    })
    if (!boarding) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const trip = await db.trip.findFirst({
      where: { id: tripId, schoolId, deletedAt: null },
      select: {
        polylineEncoded: true,
        route: {
          select: {
            stops: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
              },
              orderBy: { stopOrder: "asc" },
            },
          },
        },
      },
    })
    if (!trip) return actionError(ACTION_ERRORS.NOT_FOUND)

    const stops = trip.route.stops
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
      }))

    return {
      success: true as const,
      data: { stops, polylineEncoded: trip.polylineEncoded } as TripMapData,
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Withdraw a still-PENDING skip the current user submitted. */
export async function cancelTransportSkip(id: string) {
  const ctx = await requireContext("read_own")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx
  try {
    const result = await db.absenceIntention.deleteMany({
      where: {
        id,
        schoolId,
        submittedBy: userId,
        reason: "TRANSPORTATION",
        status: "PENDING",
      },
    })
    if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
    revalidatePath(transportationRevalidatePath("me"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}
