"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30

export async function getOverviewStats() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const [
      totalVehicles,
      activeVehicles,
      totalRoutes,
      activeRoutes,
      totalDrivers,
      activeDrivers,
      activeAssignments,
    ] = await Promise.all([
      db.vehicle.count({ where: { schoolId, deletedAt: null } }),
      db.vehicle.count({
        where: { schoolId, deletedAt: null, status: "ACTIVE" },
      }),
      db.route.count({ where: { schoolId, deletedAt: null } }),
      db.route.count({
        where: { schoolId, deletedAt: null, status: "ACTIVE" },
      }),
      db.driver.count({ where: { schoolId, deletedAt: null } }),
      db.driver.count({
        where: { schoolId, deletedAt: null, status: "ACTIVE" },
      }),
      db.routeAssignment.count({
        where: { schoolId, deletedAt: null, status: "ACTIVE" },
      }),
    ])

    return {
      success: true as const,
      data: {
        totalVehicles,
        activeVehicles,
        totalRoutes,
        activeRoutes,
        totalDrivers,
        activeDrivers,
        activeAssignments,
      },
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Returns drivers with licenses expiring in the next 30 days plus vehicles
 * with insurance/registration expiring in the same window. Used on the
 * overview dashboard to surface compliance warnings.
 */
export async function getExpiringDocuments() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const now = new Date()
  const cutoff = new Date(now.getTime() + THIRTY_DAYS_MS)

  try {
    const [drivers, vehicles] = await Promise.all([
      db.driver.findMany({
        where: {
          schoolId,
          deletedAt: null,
          licenseExpiry: { lte: cutoff },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          licenseExpiry: true,
        },
        orderBy: { licenseExpiry: "asc" },
        take: 20,
      }),
      db.vehicle.findMany({
        where: {
          schoolId,
          deletedAt: null,
          OR: [
            { registrationExpiry: { lte: cutoff } },
            { insuranceExpiry: { lte: cutoff } },
          ],
        },
        select: {
          id: true,
          plateNumber: true,
          registrationExpiry: true,
          insuranceExpiry: true,
        },
        orderBy: { plateNumber: "asc" },
        take: 20,
      }),
    ])

    return {
      success: true as const,
      data: { drivers, vehicles, asOf: now.toISOString() },
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getRecentAssignments(limit = 10) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const items = await db.routeAssignment.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        route: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return { success: true as const, data: items }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
