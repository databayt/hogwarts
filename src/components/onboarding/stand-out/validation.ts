import { z } from "zod";
import { STAND_OUT_CONSTANTS } from './constant';

export const standOutValidation = z.object({
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  features: z
    .array(z.string())
    .max(STAND_OUT_CONSTANTS.MAX_FEATURES, `You can select up to ${STAND_OUT_CONSTANTS.MAX_FEATURES} features`)
    .default([]),
  uniqueSellingPoints: z
    .array(z.string())
    .optional(),
  specialPrograms: z
    .array(z.string())
    .optional(),
  achievements: z
    .array(z.string())
    .optional(),
});

export function validateStandOutStep(data: any): { isValid: boolean; errors: Record<string, string> } {
  try {
    standOutValidation.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
}

export type StandOutValidation = z.infer<typeof standOutValidation>;