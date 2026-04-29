"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Geofence-driven boarding (M2-3)
//
// Bridges existing GeoFence/GeoAttendanceEvent infrastructure into the
// transportation block. When a student enters a geofence linked to a route,
// we record a TripBoarding on that route's currently-IN_PROGRESS trip
// (today's scheduled trip). Exit events flip status to ALIGHTED.
//
// All writes are scoped by schoolId. Idempotent — multiple events for the
// same student/trip just update the same TripBoarding row (upsert).
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext, transportationRevalidatePath } from "./helpers"

const geofenceBoardingSchema = z.object({
  studentId: z.string().min(1),
  geofenceId: z.string().min(1),
  eventType: z.enum(["ENTER", "EXIT"]),
  timestamp: z.string().datetime().optional(),
})

export type GeofenceBoardingInput = z.infer<typeof geofenceBoardingSchema>

/**
 * Record a TripBoarding from a geofence event.
 *
 * Resolution flow:
 * 1. Find the route linked to this geofence (must belong to the same school)
 * 2. Find that student's ACTIVE RouteAssignment on the route → gives us stopId
 * 3. Find today's IN_PROGRESS trip on the route
 * 4. Upsert TripBoarding with BOARDED (ENTER) or ALIGHTED (EXIT)
 *
 * Returns NOT_FOUND-style errors at each missing-link step. The geofence
 * collector should treat those as "no-op, ignore".
 */
export async function recordBoardingFromGeofence(input: GeofenceBoardingInput) {
  const ctx = await requireContext("record_boarding")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = geofenceBoardingSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { studentId, geofenceId, eventType, timestamp } = parsed.data

  try {
    const route = await db.route.findFirst({
      where: { schoolId, geofenceId, deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    const assignment = await db.routeAssignment.findFirst({
      where: {
        schoolId,
        studentId,
        routeId: route.id,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { stopId: true },
    })
    if (!assignment) {
      return actionError(ACTION_ERRORS.ROUTE_ASSIGNMENT_NOT_FOUND)
    }

    // Today's IN_PROGRESS trip (scheduled for today, status IN_PROGRESS).
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)

    const trip = await db.trip.findFirst({
      where: {
        schoolId,
        routeId: route.id,
        status: "IN_PROGRESS",
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { scheduledTime: "asc" },
    })
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
        recordedBy: userId,
      },
      create: {
        schoolId,
        tripId: trip.id,
        studentId,
        stopId: assignment.stopId,
        status: targetStatus,
        boardedAt: targetStatus === "BOARDED" ? at : undefined,
        alightedAt: targetStatus === "ALIGHTED" ? at : undefined,
        recordedBy: userId,
      },
    })

    revalidatePath(transportationRevalidatePath(`trips/${trip.id}`))
    return { success: true as const, data: boarding }
  } catch {
    return actionError(ACTION_ERRORS.BOARDING_UPDATE_FAILED)
  }
}
