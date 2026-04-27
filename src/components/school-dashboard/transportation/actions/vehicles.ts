"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  vehicleSchema,
  vehicleUpdateSchema,
  type VehicleServerInput,
  type VehicleUpdateInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

function toDateOrUndefined(value: string | undefined | null) {
  return value ? new Date(value) : undefined
}

export async function createVehicle(input: VehicleServerInput) {
  const ctx = await requireContext("manage_vehicle")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = vehicleSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const existing = await db.vehicle.findFirst({
      where: { schoolId, plateNumber: data.plateNumber, deletedAt: null },
      select: { id: true },
    })
    if (existing) {
      return actionError(ACTION_ERRORS.VEHICLE_PLATE_TAKEN)
    }

    const vehicle = await db.vehicle.create({
      data: {
        schoolId,
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        capacity: data.capacity,
        vehicleType: data.vehicleType,
        status: data.status,
        registrationExpiry: toDateOrUndefined(data.registrationExpiry),
        insuranceExpiry: toDateOrUndefined(data.insuranceExpiry),
        lastInspection: toDateOrUndefined(data.lastInspection),
        notes: data.notes,
      },
    })

    revalidatePath(transportationRevalidatePath("vehicles"))
    return { success: true as const, data: vehicle }
  } catch {
    return actionError(ACTION_ERRORS.VEHICLE_CREATE_FAILED)
  }
}

export async function updateVehicle(input: VehicleUpdateInput) {
  const ctx = await requireContext("manage_vehicle")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = vehicleUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, ...data } = parsed.data

  try {
    const current = await db.vehicle.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, plateNumber: true },
    })
    if (!current) return actionError(ACTION_ERRORS.VEHICLE_NOT_FOUND)

    if (data.plateNumber && data.plateNumber !== current.plateNumber) {
      const dupe = await db.vehicle.findFirst({
        where: {
          schoolId,
          plateNumber: data.plateNumber,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      })
      if (dupe) return actionError(ACTION_ERRORS.VEHICLE_PLATE_TAKEN)
    }

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...data,
        registrationExpiry: toDateOrUndefined(data.registrationExpiry),
        insuranceExpiry: toDateOrUndefined(data.insuranceExpiry),
        lastInspection: toDateOrUndefined(data.lastInspection),
      },
    })

    revalidatePath(transportationRevalidatePath("vehicles"))
    revalidatePath(transportationRevalidatePath(`vehicles/${id}`))
    return { success: true as const, data: vehicle }
  } catch {
    return actionError(ACTION_ERRORS.VEHICLE_UPDATE_FAILED)
  }
}

export async function deleteVehicle(id: string) {
  const ctx = await requireContext("manage_vehicle")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.vehicle.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!current) return actionError(ACTION_ERRORS.VEHICLE_NOT_FOUND)

    await db.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(transportationRevalidatePath("vehicles"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.VEHICLE_DELETE_FAILED)
  }
}

export async function restoreVehicle(id: string) {
  const ctx = await requireContext("manage_vehicle")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.vehicle.findFirst({
      where: { id, schoolId, NOT: { deletedAt: null } },
      select: { id: true },
    })
    if (!current) return actionError(ACTION_ERRORS.VEHICLE_NOT_FOUND)

    await db.vehicle.update({
      where: { id },
      data: { deletedAt: null },
    })

    revalidatePath(transportationRevalidatePath("vehicles"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.VEHICLE_UPDATE_FAILED)
  }
}

export async function listVehicles() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const vehicles = await db.vehicle.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: [{ status: "asc" }, { plateNumber: "asc" }],
    })
    return { success: true as const, data: vehicles }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getVehicle(id: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const vehicle = await db.vehicle.findFirst({
      where: { id, schoolId, deletedAt: null },
    })
    if (!vehicle) return actionError(ACTION_ERRORS.VEHICLE_NOT_FOUND)
    return { success: true as const, data: vehicle }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
