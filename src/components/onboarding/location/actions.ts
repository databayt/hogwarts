"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

import {
  createActionResponse,
  requireSchoolOwnership,
  type ActionResponse,
} from "@/lib/auth-security"
import { db } from "@/lib/db"

import { locationSchema } from "./validation"

export type LocationFormData = z.infer<typeof locationSchema>

export async function updateSchoolLocation(
  schoolId: string,
  data: LocationFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    const validatedData = locationSchema.parse(data)

    // Format full address without postal code
    const addressParts = [
      validatedData.address,
      validatedData.city,
      validatedData.state,
      validatedData.country,
    ].filter(Boolean) // Remove empty parts

    const fullAddress = addressParts.join(", ")

    // Update school location in database with coordinates
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        address: fullAddress,
        latitude:
          validatedData.latitude !== 0
            ? new Decimal(validatedData.latitude)
            : null,
        longitude:
          validatedData.longitude !== 0
            ? new Decimal(validatedData.longitude)
            : null,
        updatedAt: new Date(),
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
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    // Parse the concatenated address string
    const parsedAddress = {
      address: school.address || "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      latitude: school.latitude ? Number(school.latitude) : 0,
      longitude: school.longitude ? Number(school.longitude) : 0,
    }

    // Only parse address into components if we don't have coordinates
    // (backwards compatibility for addresses saved before Mapbox)
    if (school.address && !school.latitude) {
      const parts = school.address.split(",").map((part) => part.trim())
      if (parts.length >= 4) {
        parsedAddress.city = parts[1] || ""
        parsedAddress.state = parts[2] || ""
        parsedAddress.country = parts[3] || ""
      }
    }

    return createActionResponse(parsedAddress)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToCapacity(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    // Validate that location data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { address: true },
    })

    if (!school?.address?.trim()) {
      throw new Error("Please complete location information before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to capacity:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/capacity`)
}
