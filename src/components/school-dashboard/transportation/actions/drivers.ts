"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  driverSchema,
  driverUpdateSchema,
  type DriverServerInput,
  type DriverUpdateInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

function toDateOrUndefined(value: string | undefined | null) {
  return value ? new Date(value) : undefined
}

export async function createDriver(input: DriverServerInput) {
  const ctx = await requireContext("manage_driver")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = driverSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    const existing = await db.driver.findFirst({
      where: { schoolId, licenseNumber: data.licenseNumber, deletedAt: null },
      select: { id: true },
    })
    if (existing) return actionError(ACTION_ERRORS.DRIVER_LICENSE_TAKEN)

    const driver = await db.driver.create({
      data: {
        schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        licenseNumber: data.licenseNumber,
        licenseClass: data.licenseClass,
        licenseExpiry: new Date(data.licenseExpiry),
        status: data.status,
        dateOfBirth: toDateOrUndefined(data.dateOfBirth),
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        notes: data.notes,
        staffMemberId: data.staffMemberId,
        userId: data.userId,
      },
    })

    revalidatePath(transportationRevalidatePath("drivers"))
    return { success: true as const, data: driver }
  } catch {
    return actionError(ACTION_ERRORS.DRIVER_CREATE_FAILED)
  }
}

export async function updateDriver(input: DriverUpdateInput) {
  const ctx = await requireContext("manage_driver")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = driverUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, ...data } = parsed.data

  try {
    const current = await db.driver.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true, licenseNumber: true },
    })
    if (!current) return actionError(ACTION_ERRORS.DRIVER_NOT_FOUND)

    if (data.licenseNumber && data.licenseNumber !== current.licenseNumber) {
      const dupe = await db.driver.findFirst({
        where: {
          schoolId,
          licenseNumber: data.licenseNumber,
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      })
      if (dupe) return actionError(ACTION_ERRORS.DRIVER_LICENSE_TAKEN)
    }

    const driver = await db.driver.update({
      where: { id },
      data: {
        ...data,
        email: data.email === "" ? null : data.email,
        licenseExpiry: toDateOrUndefined(data.licenseExpiry),
        dateOfBirth: toDateOrUndefined(data.dateOfBirth),
      },
    })

    revalidatePath(transportationRevalidatePath("drivers"))
    return { success: true as const, data: driver }
  } catch {
    return actionError(ACTION_ERRORS.DRIVER_UPDATE_FAILED)
  }
}

export async function deleteDriver(id: string) {
  const ctx = await requireContext("manage_driver")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.driver.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!current) return actionError(ACTION_ERRORS.DRIVER_NOT_FOUND)

    await db.driver.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(transportationRevalidatePath("drivers"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.DRIVER_DELETE_FAILED)
  }
}

export async function listDrivers() {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const drivers = await db.driver.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        staffMember: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ status: "asc" }, { lastName: "asc" }],
    })
    return { success: true as const, data: drivers }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getDriver(id: string) {
  const ctx = await requireContext("read_school")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const driver = await db.driver.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        staffMember: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!driver) return actionError(ACTION_ERRORS.DRIVER_NOT_FOUND)
    return { success: true as const, data: driver }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
