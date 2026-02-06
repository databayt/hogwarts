"use server"

import type { ActionResponse } from "@/lib/action-response"

import { contactSchema, type ContactSchemaType } from "./validation"

export async function saveContactStep(
  data: ContactSchemaType
): Promise<ActionResponse<ContactSchemaType>> {
  try {
    const validatedData = contactSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
