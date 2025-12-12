"use server";

import { documentsSchema, type DocumentsSchemaType } from './validation';

export interface SaveDocumentsResult {
  success: boolean;
  data?: DocumentsSchemaType;
  error?: string;
}

export async function saveDocumentsStep(
  data: DocumentsSchemaType
): Promise<SaveDocumentsResult> {
  try {
    // Validate data
    const validatedData = documentsSchema.parse(data);

    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}
