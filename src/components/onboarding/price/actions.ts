"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import {
  schoolPriceSchema,
  tuitionSchema,
  type SchoolPriceFormData,
  type TuitionFormData,
} from "./validation"

// Step 4: tuition-only update used by the onboarding /price step. The full
// pricing flow (currency, registration/application fees, payment schedule)
// lives in later steps / admin pricing.
export async function updateSchoolTuition(
  schoolId: string,
  data: TuitionFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = tuitionSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: { tuitionFee: validated.tuitionFee },
    })

    revalidatePath(`/onboarding/${schoolId}/price`)
    return createActionResponse({ id: schoolId })
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

// Full pricing update — admin pricing editor still uses this shape.
export async function updateSchoolPricing(
  schoolId: string,
  data: SchoolPriceFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = schoolPriceSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: {
        tuitionFee: validated.tuitionFee,
        registrationFee: validated.registrationFee ?? null,
        applicationFee: validated.applicationFee ?? null,
        currency: validated.currency,
        paymentSchedule: validated.paymentSchedule,
      },
    })

    revalidatePath(`/onboarding/${schoolId}/price`)
    return createActionResponse({ id: schoolId })
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

export async function getSchoolPricing(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        tuitionFee: true,
        registrationFee: true,
        applicationFee: true,
        currency: true,
        paymentSchedule: true,
      },
    })

    if (!school) {
      return { success: false, code: "SCHOOL_NOT_FOUND" }
    }

    return createActionResponse({
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : 0,
      registrationFee: school.registrationFee
        ? Number(school.registrationFee)
        : 0,
      applicationFee: school.applicationFee ? Number(school.applicationFee) : 0,
      currency: (school.currency ?? "USD") as string,
      paymentSchedule: (school.paymentSchedule ?? "annual") as string,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
