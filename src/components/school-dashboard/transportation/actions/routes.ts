"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  routeSchema,
  routeUpdateSchema,
  type RouteServerInput,
  type RouteUpdateInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

export async function createRoute(input: RouteServerInput) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const existing = await db.route.findFirst({
      where: { schoolId, name: data.name, deletedAt: null },
      select: { id: true },
    })
    if (existing) return actionError(ACTION_ERRORS.ROUTE_NAME_TAKEN)

    const route = await db.route.create({
      data: {
        schoolId,
        ...data,
      },
    })

    revalidatePath(transportationRevalidatePath("routes"))
    return { success: true as const, data: route }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_CREATE_FAILED)
  }
}

export async function updateRoute(input: RouteUpdateInput) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = routeUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, ...data } = parsed.data

  try {
    const current = await db.route.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    if (data.name && data.name !== current.name) {
      const dupe = await db.route.findFirst({
        where: {
          schoolId,
          name: data.name,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      })
      if (dupe) return actionError(ACTION_ERRORS.ROUTE_NAME_TAKEN)
    }

    const route = await db.route.update({
      where: { id },
      data,
    })

    revalidatePath(transportationRevalidatePath("routes"))
    revalidatePath(transportationRevalidatePath(`routes/${id}`))
    return { success: true as const, data: route }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_UPDATE_FAILED)
  }
}

export async function deleteRoute(id: string) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.route.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)

    await db.route.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(transportationRevalidatePath("routes"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_DELETE_FAILED)
  }
}

export async function listRoutes() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const routes = await db.route.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { stops: true, assignments: true } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    })
    return { success: true as const, data: routes }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getRoute(id: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const route = await db.route.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        vehicle: true,
        driver: true,
        stops: { orderBy: { stopOrder: "asc" } },
        _count: { select: { assignments: true } },
      },
    })
    if (!route) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)
    return { success: true as const, data: route }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function restoreRoute(id: string) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.route.findFirst({
      where: { id, schoolId },
      select: { id: true, deletedAt: true },
    })
    if (!current) return actionError(ACTION_ERRORS.ROUTE_NOT_FOUND)
    if (!current.deletedAt) return { success: true as const, data: { id } }

    await db.route.update({
      where: { id },
      data: { deletedAt: null },
    })

    revalidatePath(transportationRevalidatePath("routes"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.ROUTE_UPDATE_FAILED)
  }
}

/**
 * Lists BUS_ROUTE-type geofences available to be linked to a transportation
 * route. Filters by schoolId. Used by the route form's geofence picker.
 */
export async function listAvailableGeofences() {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const fences = await db.geoFence.findMany({
      where: { schoolId, type: "BUS_ROUTE", isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    })
    return { success: true as const, data: fences }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
