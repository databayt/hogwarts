"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Student transport profile — the canonical door-to-door pickup/drop-off point
// for a student, independent of any route. Geocoded coordinates feed the route
// optimizer (Phase 2). Gated by `manage_assignment` (ADMIN/STAFF) for writes.
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  studentTransportProfileSchema,
  type StudentTransportProfileInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

export interface TransportProfileView {
  id: string
  studentId: string
  pickupAddress: string | null
  pickupLat: number | null
  pickupLng: number | null
  dropoffAddress: string | null
  dropoffLat: number | null
  dropoffLng: number | null
  specialNeeds: string | null
  pickupGeocodedAt: string | null
}

export async function upsertTransportProfile(
  input: StudentTransportProfileInput
) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = studentTransportProfileSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { studentId, pickupLat, pickupLng, ...rest } = parsed.data

  try {
    // Tenant guard: the student must belong to this school.
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    const hasPickupCoords =
      typeof pickupLat === "number" && typeof pickupLng === "number"

    const data = {
      ...rest,
      pickupLat: pickupLat ?? null,
      pickupLng: pickupLng ?? null,
      pickupGeocodedAt: hasPickupCoords ? new Date() : null,
    }

    const profile = await db.studentTransportProfile.upsert({
      where: { studentId },
      create: { schoolId, studentId, ...data },
      update: data,
    })

    revalidatePath(transportationRevalidatePath("assignments"))
    return { success: true as const, data: { id: profile.id } }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

export async function getTransportProfile(studentId: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const profile = await db.studentTransportProfile.findFirst({
      where: { studentId, schoolId },
    })
    if (!profile) return { success: true as const, data: null }

    const view: TransportProfileView = {
      id: profile.id,
      studentId: profile.studentId,
      pickupAddress: profile.pickupAddress,
      pickupLat: profile.pickupLat ? profile.pickupLat.toNumber() : null,
      pickupLng: profile.pickupLng ? profile.pickupLng.toNumber() : null,
      dropoffAddress: profile.dropoffAddress,
      dropoffLat: profile.dropoffLat ? profile.dropoffLat.toNumber() : null,
      dropoffLng: profile.dropoffLng ? profile.dropoffLng.toNumber() : null,
      specialNeeds: profile.specialNeeds,
      pickupGeocodedAt: profile.pickupGeocodedAt
        ? profile.pickupGeocodedAt.toISOString()
        : null,
    }
    return { success: true as const, data: view }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
