import { z } from 'zod';

export const descriptionSchema = z.object({
  schoolLevel: z.enum(['primary', 'secondary', 'both']).describe("Please select a school level"),
  schoolType: z.enum(['private', 'public', 'international', 'technical', 'special']).describe("Please select a school type"),
});

export type DescriptionFormData = z.infer<typeof descriptionSchema>;