// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Pure-logic geofence-boarding helper. Caller MUST resolve schoolId — no auth,
// no permission check inside. Used by:
//   1. recordBoardingFromGeofence (user-facing server action) — wraps with
//      requireContext + Zod parse
//   2. /api/transportation/geofence-boarding (service-account webhook) — wraps
//      with bearer token verification
//
// Idempotent: upserts TripBoarding on (schoolId, tripId, studentId).

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

export interface GeofenceBoardingPayload {
  schoolId: string
  studentId: string
  geofenceId: string
  eventType: "ENTER" | "EXIT"
  timestamp?: string
  /** userId for user-driven calls; "system:api-token:<id>" for service calls */
  recordedBy: string | null
}

export async function recordBoardingFromGeofenceInternal(
  input: GeofenceBoardingPayload
) {
  const { schoolId, studentId, geofenceId, eventType, timestamp, recordedBy } =
    input

  try {
    const route = await db.route.findFirst({
      where: { schoolId, geofenceId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)

    // Assignment and trip both key off route.id only (not each other) → run
    // them concurrently to shave a round-trip off this hot webhook path.
    const [assignment, trip] = await Promise.all([
      db.routeAssignment.findFirst({
        where: {
          schoolId,
          studentId,
          routeId: route.id,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { stopId: true },
      }),
      db.trip.findFirst({
        where: {
          schoolId,
          routeId: route.id,
          status: "IN_PROGRESS",
          scheduledDate: { gte: startOfDay, lte: endOfDay },
          deletedAt: null,
        },
        select: { id: true },
        orderBy: { scheduledTime: "asc" },
      }),
    ])
    if (!assignment) {
      return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)
    }
    if (!trip) return actionError(ACTION_ERRORS.TRIP_INVALID_STATE)

    const at = timestamp ? new Date(timestamp) : new Date()
    const targetStatus = eventType === "ENTER" ? "BOARDED" : "ALIGHTED"

    const boarding = await db.tripBoarding.upsert({
      where: {
        schoolId_tripId_studentId: {
          schoolId,
          tripId: trip.id,
          studentId,
        },
      },
      update: {
        status: targetStatus,
        boardedAt: targetStatus === "BOARDED" ? at : undefined,
        alightedAt: targetStatus === "ALIGHTED" ? at : undefined,
        recordedBy: recordedBy ?? undefined,
      },
      create: {
        schoolId,
        tripId: trip.id,
        studentId,
        stopId: assignment.stopId,
        status: targetStatus,
        boardedAt: targetStatus === "BOARDED" ? at : undefined,
        alightedAt: targetStatus === "ALIGHTED" ? at : undefined,
        recordedBy: recordedBy ?? undefined,
      },
    })

    return { success: true as const, data: boarding, tripId: trip.id }
  } catch {
    return actionError(ACTION_ERRORS.BOARDING_UPDATE_FAILED)
  }
}
