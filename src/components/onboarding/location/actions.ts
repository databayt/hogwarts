"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"
import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"

import { requireSchoolOwnership } from "../auth-helpers"
import { locationSchema, type LocationFormData } from "./validation"

export async function updateSchoolLocation(
  schoolId: string,
  data: LocationFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = locationSchema.parse(data)

    // Step 5: auto-derive currency from country during onboarding. Only
    // overwrite when the stored value is still the schema default ("USD"),
    // so admin/user overrides elsewhere are never clobbered. This fixes
    // the long-standing bug where every school persisted USD regardless
    // of country (e.g. Sudanese schools stuck with USD instead of SDG).
    const current = await db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true, tuitionFee: true },
    })
    const resolvedCurrency = resolveDefaultCurrency(validated.country)
    const shouldAutoSetCurrency =
      current?.currency === "USD" &&
      !current?.tuitionFee &&
      resolvedCurrency !== "USD"

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        latitude:
          validated.latitude !== 0 ? new Decimal(validated.latitude) : null,
        longitude:
          validated.longitude !== 0 ? new Decimal(validated.longitude) : null,
        ...(shouldAutoSetCurrency ? { currency: resolvedCurrency } : {}),
      },
    })

    revalidatePath(`/onboarding/${schoolId}/location`)
    return createActionResponse({ id: updatedSchool.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        errors: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message])
        ),
      }
    }
    return createActionResponse(undefined, error)
  }
}

export async function getSchoolLocation(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!school) {
      return { success: false, code: "SCHOOL_NOT_FOUND" }
    }

    return createActionResponse({
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      country: school.country || "",
      postalCode: "",
      latitude: school.latitude ? Number(school.latitude) : 0,
      longitude: school.longitude ? Number(school.longitude) : 0,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
