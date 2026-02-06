"use server"

import type { ActionResponse } from "@/lib/action-response"

import { documentsSchema, type DocumentsSchemaType } from "./validation"

export async function saveDocumentsStep(
  data: DocumentsSchemaType
): Promise<ActionResponse<DocumentsSchemaType>> {
  try {
    const validatedData = documentsSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
