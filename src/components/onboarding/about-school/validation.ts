import { z } from "zod";

// About School step validation (minimal since it's informational)
export const aboutSchoolValidation = z.object({
  viewed: z.boolean().default(false),
  viewedAt: z.date().optional(),
});

export const welcomeDataValidation = z.object({
  totalSteps: z.number().min(1),
  estimatedTime: z.string(),
  completionRate: z.number().min(0).max(100),
});

// No form validation needed since this is an informational step
export function validateAboutSchoolStep(): { isValid: boolean; errors: Record<string, string> } {
  // About school step is always valid since it's informational
  return { isValid: true, errors: {} };
}

export type AboutSchoolValidation = z.infer<typeof aboutSchoolValidation>;
export type WelcomeDataValidation = z.infer<typeof welcomeDataValidation>;