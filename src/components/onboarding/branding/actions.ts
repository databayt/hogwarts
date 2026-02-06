"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { brandingSchema } from "./validation"

export type BrandingFormData = z.infer<typeof brandingSchema>

export async function updateSchoolBranding(
  schoolId: string,
  data: BrandingFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = brandingSchema.parse(data)

    // Update school name and logo
    await db.school.update({
      where: { id: schoolId },
      data: {
        logoUrl: validated.logoUrl ?? undefined,
        name: validated.brandName,
      },
    })

    // Upsert branding into SchoolBranding model
    const branding = await db.schoolBranding.upsert({
      where: { schoolId },
      update: {
        primaryColor: validated.primaryColor ?? null,
        secondaryColor: validated.secondaryColor ?? null,
      },
      create: {
        schoolId,
        primaryColor: validated.primaryColor ?? null,
        secondaryColor: validated.secondaryColor ?? null,
      },
    })

    revalidatePath(`/onboarding/${schoolId}/branding`)
    return createActionResponse(branding)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, error)
    }
    return createActionResponse(undefined, error)
  }
}

export async function getSchoolBranding(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const [school, branding] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { id: true, logoUrl: true, name: true },
      }),
      db.schoolBranding.findUnique({
        where: { schoolId },
        select: { primaryColor: true, secondaryColor: true },
      }),
    ])

    if (!school) throw new Error("School not found")

    return createActionResponse({
      logoUrl: school.logoUrl || "",
      brandName: school.name || "",
      primaryColor: branding?.primaryColor || "#000000",
      secondaryColor: branding?.secondaryColor || "#ffffff",
      tagline: "",
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
