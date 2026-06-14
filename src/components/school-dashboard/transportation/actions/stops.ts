"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  reorderStopsSchema,
  routeStopSchema,
  routeStopUpdateSchema,
  type ReorderStopsServerInput,
  type RouteStopServerInput,
  type RouteStopUpdateInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

export async function addRouteStop(input: RouteStopServerInput) {
  const ctx = await requireContext("manage_stop")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeStopSchema.safeParse(input)
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

    const conflict = await db.routeStop.findFirst({
      where: {
        schoolId,
        routeId: data.routeId,
        stopOrder: data.stopOrder,
      },
      select: { id: true },
    })
    if (conflict) return actionError(ACTION_ERRORS.STOP_ORDER_CONFLICT)

    const stop = await db.routeStop.create({
      data: {
        schoolId,
        ...data,
      },
    })

    revalidatePath(transportationRevalidatePath(`routes/${data.routeId}`))
    return { success: true as const, data: stop }
  } catch {
    return actionError(ACTION_ERRORS.STOP_CREATE_FAILED)
  }
}

export async function updateRouteStop(input: RouteStopUpdateInput) {
  const ctx = await requireContext("manage_stop")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeStopUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, ...data } = parsed.data

  try {
    const current = await db.routeStop.findFirst({
      where: { id, schoolId },
      select: { id: true, routeId: true, stopOrder: true },
    })
    if (!current) return actionError(ACTION_ERRORS.STOP_NOT_FOUND)

    if (
      typeof data.stopOrder === "number" &&
      data.stopOrder !== current.stopOrder
    ) {
      const conflict = await db.routeStop.findFirst({
        where: {
          schoolId,
          routeId: current.routeId,
          stopOrder: data.stopOrder,
          NOT: { id },
        },
        select: { id: true },
      })
      if (conflict) return actionError(ACTION_ERRORS.STOP_ORDER_CONFLICT)
    }

    const stop = await db.routeStop.update({
      where: { id },
      data,
    })

    revalidatePath(transportationRevalidatePath(`routes/${current.routeId}`))
    return { success: true as const, data: stop }
  } catch {
    return actionError(ACTION_ERRORS.STOP_UPDATE_FAILED)
  }
}

/**
 * Reorder stops on a route. Accepts an ordered array of stop IDs and
 * rewrites their stopOrder values in a transaction. Uses a two-phase
 * approach (negative offset → final order) to avoid hitting the unique
 * constraint mid-transaction.
 */
export async function reorderStops(input: ReorderStopsServerInput) {
  const ctx = await requireContext("manage_stop")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = reorderStopsSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { routeId, stopIds } = parsed.data

  try {
    const route = await db.route.findFirst({
      where: { id: routeId, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    const stops = await db.routeStop.findMany({
      where: { schoolId, routeId },
      select: { id: true },
    })
    const validIds = new Set(stops.map((s) => s.id))
    const allBelong = stopIds.every((id) => validIds.has(id))
    if (!allBelong || stopIds.length !== stops.length) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.$transaction(async (tx) => {
      for (let i = 0; i < stopIds.length; i++) {
        await tx.routeStop.update({
          where: { id: stopIds[i] },
          data: { stopOrder: -(i + 1) },
        })
      }
      for (let i = 0; i < stopIds.length; i++) {
        await tx.routeStop.update({
          where: { id: stopIds[i] },
          data: { stopOrder: i + 1 },
        })
      }
    })

    revalidatePath(transportationRevalidatePath(`routes/${routeId}`))
    return { success: true as const, data: { routeId } }
  } catch {
    return actionError(ACTION_ERRORS.STOP_UPDATE_FAILED)
  }
}

export async function deleteStop(id: string) {
  const ctx = await requireContext("manage_stop")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.routeStop.findFirst({
      where: { id, schoolId },
      select: { id: true, routeId: true },
    })
    if (!current) return actionError(ACTION_ERRORS.STOP_NOT_FOUND)

    const usedBy = await db.routeAssignment.count({
      where: { schoolId, stopId: id, deletedAt: null, status: "ACTIVE" },
    })
    if (usedBy > 0) {
      return actionError(ACTION_ERRORS.HAS_DEPENDENCIES)
    }

    // RouteStop hard-delete cascades to TripBoarding (onDelete: Cascade), so a
    // stop referenced by historical boardings would silently wipe that trip
    // history. Block the delete if any boarding ever referenced this stop.
    const usedInBoardings = await db.tripBoarding.count({
      where: { schoolId, stopId: id },
    })
    if (usedInBoardings > 0) {
      return actionError(ACTION_ERRORS.HAS_DEPENDENCIES)
    }

    await db.routeStop.delete({ where: { id } })

    revalidatePath(transportationRevalidatePath(`routes/${current.routeId}`))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.STOP_DELETE_FAILED)
  }
}
