"use server";

import { personalSchema, type PersonalSchemaType } from './validation';

export interface SavePersonalResult {
  success: boolean;
  data?: PersonalSchemaType;
  error?: string;
}

export async function savePersonalStep(
  data: PersonalSchemaType
): Promise<SavePersonalResult> {
  try {
    // Validate data
    const validatedData = personalSchema.parse(data);

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
