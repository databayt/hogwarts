"use server"

import type { ActionResponse } from "@/lib/action-response"

import { guardianSchema, type GuardianSchemaType } from "./validation"

export async function saveGuardianStep(
  data: GuardianSchemaType
): Promise<ActionResponse<GuardianSchemaType>> {
  try {
    const validatedData = guardianSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
