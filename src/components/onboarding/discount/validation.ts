import { z } from 'zod';

export const discountSchema = z.object({
  newFamilyDiscount: z.boolean().default(false),
  newFamilyPercentage: z.number().min(0).max(100).optional(),
  siblingDiscount: z.boolean().default(false),
  siblingPercentage: z.number().min(0).max(100).optional(),
  earlyEnrollmentDiscount: z.boolean().default(false),
  earlyEnrollmentPercentage: z.number().min(0).max(100).optional(),
});

export type DiscountFormData = z.infer<typeof discountSchema>;
