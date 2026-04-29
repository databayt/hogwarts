"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  boardingUpsertSchema,
  tripCancelSchema,
  tripFinishSchema,
  tripSchema,
  tripStartSchema,
  type BoardingUpsertInput,
  type TripCancelInput,
  type TripFinishInput,
  type TripServerInput,
  type TripStartInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"
import { notifyGuardiansOfTripEvent } from "./notifications"

export async function scheduleTrip(input: TripServerInput) {
  const ctx = await requireContext("manage_trip")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = tripSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const route = await db.route.findFirst({
      where: { id: data.routeId, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    const dupe = await db.trip.findFirst({
      where: {
        schoolId,
        routeId: data.routeId,
        scheduledDate: new Date(data.scheduledDate),
        direction: data.direction,
      },
      select: { id: true },
    })
    if (dupe) return actionError(ACTION_ERRORS.TRIP_DUPLICATE)

    const trip = await db.trip.create({
      data: {
        schoolId,
        routeId: data.routeId,
        vehicleId: data.vehicleId ?? null,
        driverId: data.driverId ?? null,
        direction: data.direction,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        status: "SCHEDULED",
        notes: data.notes,
      },
    })

    revalidatePath(transportationRevalidatePath("trips"))
    return { success: true as const, data: trip }
  } catch {
    return actionError(ACTION_ERRORS.TRIP_CREATE_FAILED)
  }
}

export async function startTrip(input: TripStartInput) {
  const ctx = await requireContext("manage_trip")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = tripStartSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id } = parsed.data

  try {
    const current = await db.trip.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, status: true, routeId: true },
    })
    if (!current) return actionError(ACTION_ERRORS.TRIP_NOT_FOUND)
    if (current.status !== "SCHEDULED") {
      return actionError(ACTION_ERRORS.TRIP_INVALID_STATE)
    }

    // Pre-populate boardings for all active route assignments
    const assignments = await db.routeAssignment.findMany({
      where: {
        schoolId,
        routeId: current.routeId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { studentId: true, stopId: true },
    })

    await db.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id },
        data: { status: "IN_PROGRESS", actualStartTime: new Date() },
      })
      if (assignments.length > 0) {
        await tx.tripBoarding.createMany({
          data: assignments.map((a) => ({
            schoolId,
            tripId: id,
            studentId: a.studentId,
            stopId: a.stopId,
            status: "PENDING",
          })),
          skipDuplicates: true,
        })
      }
    })

    revalidatePath(transportationRevalidatePath("trips"))
    revalidatePath(transportationRevalidatePath(`trips/${id}`))

    void notifyGuardiansOfTripEvent({
      schoolId,
      tripId: id,
      routeId: current.routeId,
      kind: "trip_started",
      title: "Bus departed",
      body: "Your child's bus has started its route.",
    })

    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.TRIP_UPDATE_FAILED)
  }
}

export async function finishTrip(input: TripFinishInput) {
  const ctx = await requireContext("manage_trip")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = tripFinishSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, notes } = parsed.data

  try {
    const current = await db.trip.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!current) return actionError(ACTION_ERRORS.TRIP_NOT_FOUND)
    if (current.status !== "IN_PROGRESS") {
      return actionError(ACTION_ERRORS.TRIP_INVALID_STATE)
    }

    const trip = await db.trip.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualEndTime: new Date(),
        notes: notes ?? undefined,
      },
    })

    revalidatePath(transportationRevalidatePath("trips"))
    revalidatePath(transportationRevalidatePath(`trips/${id}`))

    void notifyGuardiansOfTripEvent({
      schoolId,
      tripId: id,
      routeId: trip.routeId,
      kind: "trip_finished",
      title: "Bus arrived",
      body: "Your child's bus has completed its route.",
    })

    return { success: true as const, data: trip }
  } catch {
    return actionError(ACTION_ERRORS.TRIP_UPDATE_FAILED)
  }
}

export async function cancelTrip(input: TripCancelInput) {
  const ctx = await requireContext("manage_trip")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = tripCancelSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, reason } = parsed.data

  try {
    const current = await db.trip.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!current) return actionError(ACTION_ERRORS.TRIP_NOT_FOUND)
    if (current.status === "COMPLETED" || current.status === "CANCELLED") {
      return actionError(ACTION_ERRORS.TRIP_INVALID_STATE)
    }

    const trip = await db.trip.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: reason ?? undefined,
      },
    })

    revalidatePath(transportationRevalidatePath("trips"))
    revalidatePath(transportationRevalidatePath(`trips/${id}`))

    void notifyGuardiansOfTripEvent({
      schoolId,
      tripId: id,
      routeId: trip.routeId,
      kind: "trip_cancelled",
      title: "Bus trip cancelled",
      body: reason
        ? `Your child's bus trip was cancelled: ${reason}`
        : "Your child's bus trip has been cancelled.",
    })

    return { success: true as const, data: trip }
  } catch {
    return actionError(ACTION_ERRORS.TRIP_UPDATE_FAILED)
  }
}

export async function recordBoarding(input: BoardingUpsertInput) {
  const ctx = await requireContext("record_boarding")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = boardingUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const trip = await db.trip.findFirst({
      where: {
        id: data.tripId,
        schoolId,
        deletedAt: null,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    })
    if (!trip) return actionError(ACTION_ERRORS.TRIP_INVALID_STATE)

    const now = new Date()
    const boarding = await db.tripBoarding.upsert({
      where: {
        schoolId_tripId_studentId: {
          schoolId,
          tripId: data.tripId,
          studentId: data.studentId,
        },
      },
      update: {
        status: data.status,
        notes: data.notes,
        recordedBy: userId,
        boardedAt: data.status === "BOARDED" ? now : undefined,
        alightedAt: data.status === "ALIGHTED" ? now : undefined,
      },
      create: {
        schoolId,
        tripId: data.tripId,
        studentId: data.studentId,
        stopId: data.stopId,
        status: data.status,
        notes: data.notes,
        recordedBy: userId,
        boardedAt: data.status === "BOARDED" ? now : undefined,
        alightedAt: data.status === "ALIGHTED" ? now : undefined,
      },
    })

    revalidatePath(transportationRevalidatePath(`trips/${data.tripId}`))
    return { success: true as const, data: boarding }
  } catch {
    return actionError(ACTION_ERRORS.BOARDING_UPDATE_FAILED)
  }
}

export async function listTrips(filters?: {
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  driverId?: string
  routeId?: string
  fromDate?: string
  toDate?: string
}) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const trips = await db.trip.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.driverId && { driverId: filters.driverId }),
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...((filters?.fromDate || filters?.toDate) && {
          scheduledDate: {
            ...(filters?.fromDate && { gte: new Date(filters.fromDate) }),
            ...(filters?.toDate && { lte: new Date(filters.toDate) }),
          },
        }),
      },
      include: {
        route: { select: { id: true, name: true, code: true } },
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { boardings: true } },
      },
      orderBy: [{ scheduledDate: "desc" }, { scheduledTime: "asc" }],
      take: 100,
    })
    return { success: true as const, data: trips }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getTrip(id: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const trip = await db.trip.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        route: {
          include: { stops: { orderBy: { stopOrder: "asc" } } },
        },
        vehicle: true,
        driver: true,
        boardings: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            stop: { select: { id: true, name: true, stopOrder: true } },
          },
          orderBy: { stop: { stopOrder: "asc" } },
        },
      },
    })
    if (!trip) return actionError(ACTION_ERRORS.TRIP_NOT_FOUND)
    return { success: true as const, data: trip }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
