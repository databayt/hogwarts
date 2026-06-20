"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Manual route-optimization actions: regenerate a single trip's plan, and
// re-order a route's DEFAULT stop sequence to the optimized geometric order.
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { computeTripPlan, generateAndStoreTripPlan } from "../lib/plan"
import { requireContext, transportationRevalidatePath } from "./helpers"

/**
 * Recompute and persist the optimized plan (ordered stops + ETAs + polyline) for
 * one trip. Manual — runs regardless of the school's optimization flag.
 */
export async function regenerateTripPlan(tripId: string) {
  const ctx = await requireContext("manage_trip")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const trip = await db.trip.findFirst({
      where: { id: tripId, schoolId, deletedAt: null },
      select: { id: true, routeId: true, direction: true },
    })
    if (!trip) return actionError(ACTION_ERRORS.TRIP_NOT_FOUND)

    const ok = await generateAndStoreTripPlan({
      schoolId,
      tripId: trip.id,
      routeId: trip.routeId,
      direction: trip.direction,
    })
    if (!ok) return actionError(ACTION_ERRORS.SAVE_FAILED)

    revalidatePath(transportationRevalidatePath(`trips/${tripId}`))
    return { success: true as const, data: { id: tripId } }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/**
 * Re-order a route's stops to the optimized visit sequence. Stops without
 * coordinates keep their relative order and are appended after the optimized
 * ones. Uses the two-phase (negative offset → final) write so the
 * `@@unique([schoolId, routeId, stopOrder])` constraint never trips mid-tx.
 */
export async function optimizeRouteDefault(routeId: string) {
  const ctx = await requireContext("manage_stop")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const route = await db.route.findFirst({
      where: { id: routeId, schoolId, deletedAt: null },
      select: { id: true, direction: true },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    const plan = await computeTripPlan({
      schoolId,
      routeId,
      direction: route.direction,
    })
    if (!plan || plan.optimizedStopOrder.length === 0) {
      return actionError(ACTION_ERRORS.SAVE_FAILED)
    }

    const allStops = await db.routeStop.findMany({
      where: { schoolId, routeId },
      select: { id: true },
      orderBy: { stopOrder: "asc" },
    })
    const optimizedIds = plan.optimizedStopOrder.map((s) => s.stopId)
    const optimizedSet = new Set(optimizedIds)
    // Optimized stops first (visit order), then any non-geolocated stops.
    const finalOrder = [
      ...optimizedIds,
      ...allStops.map((s) => s.id).filter((id) => !optimizedSet.has(id)),
    ]

    await db.$transaction(async (tx) => {
      for (let i = 0; i < finalOrder.length; i++) {
        await tx.routeStop.update({
          where: { id: finalOrder[i] },
          data: { stopOrder: -(i + 1) },
        })
      }
      for (let i = 0; i < finalOrder.length; i++) {
        await tx.routeStop.update({
          where: { id: finalOrder[i] },
          data: { stopOrder: i + 1 },
        })
      }
    })

    revalidatePath(transportationRevalidatePath(`routes/${routeId}`))
    return {
      success: true as const,
      data: {
        routeId,
        source: plan.planSource,
        distanceKm: plan.totalDistanceKm,
      },
    }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
