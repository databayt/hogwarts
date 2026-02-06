"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export const schoolPriceSchema = z.object({
  tuitionFee: z
    .number()
    .min(0, "Tuition fee cannot be negative")
    .max(50000, "Tuition fee cannot exceed $50,000"),
  registrationFee: z
    .number()
    .min(0, "Registration fee cannot be negative")
    .max(5000, "Registration fee cannot exceed $5,000")
    .optional(),
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee cannot exceed $1,000")
    .optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).default("USD"),
  paymentSchedule: z
    .enum(["monthly", "quarterly", "semester", "annual"])
    .default("monthly"),
})

export type SchoolPriceFormData = z.infer<typeof schoolPriceSchema>

export async function updateSchoolPricing(
  schoolId: string,
  data: SchoolPriceFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = schoolPriceSchema.parse(data)

    const updatedSchool = await db.school.update({
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
    return createActionResponse(updatedSchool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
      })
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

    if (!school) throw new Error("School not found")

    return createActionResponse({
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : 0,
      registrationFee: school.registrationFee
        ? Number(school.registrationFee)
        : 0,
      applicationFee: school.applicationFee ? Number(school.applicationFee) : 0,
      currency: school.currency as "USD" | "EUR" | "GBP" | "CAD" | "AUD",
      paymentSchedule: school.paymentSchedule as
        | "monthly"
        | "quarterly"
        | "semester"
        | "annual",
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
