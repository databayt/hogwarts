"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getLabels } from "@/components/translation/person"

import { requireContext } from "./helpers"

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
