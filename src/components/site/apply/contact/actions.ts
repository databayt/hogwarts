"use server";

import { contactSchema, type ContactSchemaType } from './validation';

export interface SaveContactResult {
  success: boolean;
  data?: ContactSchemaType;
  error?: string;
}

export async function saveContactStep(
  data: ContactSchemaType
): Promise<SaveContactResult> {
  try {
    // Validate data
    const validatedData = contactSchema.parse(data);

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
