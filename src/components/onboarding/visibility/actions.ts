"use server"

import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function updateVisibility(
  schoolId: string,
  data: { isPubliclyListed: boolean }
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const branding = await db.schoolBranding.upsert({
      where: { schoolId },
      update: { isPubliclyListed: data.isPubliclyListed },
      create: { schoolId, isPubliclyListed: data.isPubliclyListed },
    })

    revalidatePath(`/onboarding/${schoolId}/visibility`)
    return createActionResponse(branding)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getVisibility(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const branding = await db.schoolBranding.findUnique({
      where: { schoolId },
      select: { isPubliclyListed: true },
    })

    return createActionResponse({
      isPubliclyListed: branding?.isPubliclyListed ?? true,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
