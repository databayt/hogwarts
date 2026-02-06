"use server"

import { revalidatePath } from "next/cache"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { locationSchema } from "./validation"

export type LocationFormData = z.infer<typeof locationSchema>

export async function updateSchoolLocation(
  schoolId: string,
  data: LocationFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = locationSchema.parse(data)

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
      },
    })

    revalidatePath(`/onboarding/${schoolId}/location`)
    return createActionResponse(updatedSchool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, error)
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

    if (!school) throw new Error("School not found")

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
