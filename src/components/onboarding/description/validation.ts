import { z } from 'zod';

export const descriptionSchema = z.object({
  schoolLevel: z.enum(['primary', 'secondary', 'both'], {
    required_error: "Please select a school level",
  }),
  schoolType: z.enum(['private', 'public', 'international', 'technical', 'special'], {
    required_error: "Please select a school type",
  }),
});

export type DescriptionFormData = z.infer<typeof descriptionSchema>;