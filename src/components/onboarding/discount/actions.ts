"use server"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

/**
 * Get discounts for a school.
 * During onboarding, this step is informational - discounts can be
 * set up later from the school dashboard after subscription is active.
 */
export async function getDiscounts(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const discounts = await db.discount.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    })

    return createActionResponse(discounts)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
