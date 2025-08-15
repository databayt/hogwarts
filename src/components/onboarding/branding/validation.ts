import { z } from 'zod';

export const brandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  brandName: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
  tagline: z.string().max(200, "Tagline too long").optional(),
});

export type BrandingFormData = z.infer<typeof brandingSchema>;
