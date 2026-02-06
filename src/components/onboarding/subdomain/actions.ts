"use server"

import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function getSubdomain(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, domain: true },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({ subdomain: school.domain })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function updateSubdomain(
  schoolId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const { reserveSubdomain } = await import("@/lib/subdomain-actions")
    const result = await reserveSubdomain(subdomain, schoolId)

    if (result.success) {
      revalidatePath(`/onboarding/${schoolId}/subdomain`)
    }

    return createActionResponse(result)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
