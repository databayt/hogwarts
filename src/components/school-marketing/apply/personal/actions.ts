"use server"

import type { ActionResponse } from "@/lib/action-response"

import { personalSchema, type PersonalSchemaType } from "./validation"

export async function savePersonalStep(
  data: PersonalSchemaType
): Promise<ActionResponse<PersonalSchemaType>> {
  try {
    const validatedData = personalSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
