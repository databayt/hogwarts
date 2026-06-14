"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Reports for the transportation overview/reports page (M2-6).
// All read-only. Each function returns aggregated stats scoped by schoolId.
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"

export interface RouteUtilization {
  routeId: string
  routeName: string
  routeCode: string | null
  capacity: number | null
  activeAssignments: number
  utilizationPct: number | null
}

export interface DriverHours {
  driverId: string
  firstName: string
  lastName: string
  completedTrips: number
  totalMinutes: number
}

export interface TripStats {
  totalScheduled: number
  totalInProgress: number
  totalCompleted: number
  totalCancelled: number
  completionRate: number
}

/**
 * Capacity vs active-assignments per route. Vehicle capacity is the cap;
 * routes without an assigned vehicle get capacity=null and util=null.
 */
export async function getRouteUtilization() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const routes = await db.route.findMany({
      where: { schoolId, deletedAt: null, status: "ACTIVE" },
      include: {
        vehicle: { select: { id: true, capacity: true } },
        _count: {
          select: {
            assignments: { where: { status: "ACTIVE", deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const utilization: RouteUtilization[] = routes.map((r) => {
      const capacity = r.vehicle?.capacity ?? null
      const active = r._count.assignments
      return {
        routeId: r.id,
        routeName: r.name,
        routeCode: r.code,
        capacity,
        activeAssignments: active,
        utilizationPct:
          capacity && capacity > 0
            ? Math.round((active / capacity) * 100)
            : null,
      }
    })

    return { success: true as const, data: utilization }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Driver hours from completed trips in the past N days.
 * Uses actualStartTime + actualEndTime. Falls back to 0 if either is null.
 */
export async function getDriverHours(days = 30) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const trips = await db.trip.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: "COMPLETED",
        actualEndTime: { gte: cutoff, not: null },
        actualStartTime: { not: null },
        driverId: { not: null },
      },
      select: {
        driverId: true,
        actualStartTime: true,
        actualEndTime: true,
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const byDriver = new Map<string, DriverHours>()
    for (const t of trips) {
      if (!t.driver || !t.actualStartTime || !t.actualEndTime) continue
      const minutes = Math.max(
        0,
        Math.round(
          (t.actualEndTime.getTime() - t.actualStartTime.getTime()) / 60000
        )
      )
      const existing = byDriver.get(t.driver.id)
      if (existing) {
        existing.completedTrips += 1
        existing.totalMinutes += minutes
      } else {
        byDriver.set(t.driver.id, {
          driverId: t.driver.id,
          firstName: t.driver.firstName,
          lastName: t.driver.lastName,
          completedTrips: 1,
          totalMinutes: minutes,
        })
      }
    }

    const result = Array.from(byDriver.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    )
    return { success: true as const, data: result }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Trip-status counts and completion rate over the last N days. */
export async function getTripStats(days = 30) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    // Count per status in Postgres (covered by @@index([schoolId, scheduledDate, status]))
    // instead of transferring every trip row to tally in JS.
    const grouped = await db.trip.groupBy({
      by: ["status"],
      where: {
        schoolId,
        deletedAt: null,
        scheduledDate: { gte: cutoff },
      },
      _count: { status: true },
    })

    const counts = new Map(grouped.map((g) => [g.status, g._count.status]))
    const stats = {
      totalScheduled: counts.get("SCHEDULED") ?? 0,
      totalInProgress: counts.get("IN_PROGRESS") ?? 0,
      totalCompleted: counts.get("COMPLETED") ?? 0,
      totalCancelled: counts.get("CANCELLED") ?? 0,
      completionRate: 0,
    }
    const decided = stats.totalCompleted + stats.totalCancelled
    stats.completionRate =
      decided > 0 ? Math.round((stats.totalCompleted / decided) * 100) : 0

    return { success: true as const, data: stats }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
