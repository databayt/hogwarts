import { z } from "zod";
import { FINISH_SETUP_CONSTANTS } from "./config";

export const finishSetupValidation = z.object({
  isComplete: z.boolean(),
  completionPercentage: z
    .number()
    .min(0)
    .max(100),
  completedAt: z.date().optional(),
});

export const setupSummaryValidation = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  maxStudents: z.number().optional(),
  maxTeachers: z.number().optional(),
  tuitionFee: z.number().optional(),
  currency: z.string().optional(),
  domain: z.string().optional(),
  logo: z.string().optional(),
  isPublished: z.boolean(),
  completionPercentage: z.number().min(0).max(100),
  isComplete: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function validateSetupCompletion(
  completionPercentage: number
): { isValid: boolean; errors: Record<string, string> } {
  if (completionPercentage < FINISH_SETUP_CONSTANTS.MIN_COMPLETION_PERCENTAGE) {
    return {
      isValid: false,
      errors: {
        completion: `Setup must be at least ${FINISH_SETUP_CONSTANTS.MIN_COMPLETION_PERCENTAGE}% complete`
      }
    };
  }
  
  return { isValid: true, errors: {} };
}

export type FinishSetupValidation = z.infer<typeof finishSetupValidation>;
export type SetupSummaryValidation = z.infer<typeof setupSummaryValidation>;