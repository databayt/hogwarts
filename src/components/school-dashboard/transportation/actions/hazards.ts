"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Road-hazard management (Phase 5). Admins pin closures/accidents/flooding; the
// optimizer's Haversine tier routes around active hazards, and creating one near
// a route's stops alerts that route's guardians (route_changed).
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { haversineMeters } from "@/lib/haversine"
import {
  roadHazardSchema,
  type RoadHazardInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"
import { notifyGuardiansOfTripEvent } from "./notifications"

export interface RoadHazardView {
  id: string
  name: string
  description: string | null
  type: string
  lat: number
  lng: number
  radiusMeters: number
  expiresAt: string | null
}

export async function listRoadHazards() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx
  try {
    const hazards = await db.roadHazard.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        lat: true,
        lng: true,
        radiusMeters: true,
        expiresAt: true,
      },
    })
    return {
      success: true as const,
      data: hazards.map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        type: h.type,
        lat: Number(h.lat),
        lng: Number(h.lng),
        radiusMeters: h.radiusMeters,
        expiresAt: h.expiresAt ? h.expiresAt.toISOString() : null,
      })) as RoadHazardView[],
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function createRoadHazard(input: RoadHazardInput) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = roadHazardSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const hazard = await db.roadHazard.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description,
        type: data.type,
        lat: data.lat,
        lng: data.lng,
        radiusMeters: data.radiusMeters,
        reportedBy: userId,
        expiresAt: data.expiresAt ?? null,
      },
      select: { id: true },
    })

    // Alert guardians of routes whose stops fall within the hazard radius.
    void notifyAffectedRoutes(schoolId, data.lat, data.lng, data.radiusMeters)

    revalidatePath(transportationRevalidatePath("settings"))
    return { success: true as const, data: { id: hazard.id } }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

export async function deleteRoadHazard(id: string) {
  const ctx = await requireContext("manage_route")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx
  try {
    const result = await db.roadHazard.updateMany({
      where: { id, schoolId, isActive: true },
      data: { isActive: false },
    })
    if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
    revalidatePath(transportationRevalidatePath("settings"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/** Best-effort route_changed fan-out to guardians on routes near a hazard. */
async function notifyAffectedRoutes(
  schoolId: string,
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<void> {
  try {
    const stops = await db.routeStop.findMany({
      where: {
        schoolId,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: { routeId: true, latitude: true, longitude: true },
    })
    const affected = new Set<string>()
    for (const s of stops) {
      const d = haversineMeters(
        { lat, lng },
        { lat: Number(s.latitude), lng: Number(s.longitude) }
      )
      if (d <= radiusMeters) affected.add(s.routeId)
    }
    for (const routeId of affected) {
      void notifyGuardiansOfTripEvent({
        schoolId,
        tripId: "",
        routeId,
        kind: "route_changed",
      })
    }
  } catch {
    // best-effort
  }
}
