import { z } from 'zod';
import { getValidationMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createBrandingSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    logoUrl: z.string().url({ message: v.get('validUrlRequired') }).optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: v.get('validHexColorRequired') }).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: v.get('validHexColorRequired') }).optional(),
    brandName: z.string().min(1, { message: v.get('brandNameRequired') }).max(100, { message: v.maxLength(100) }),
    tagline: z.string().max(200, { message: v.maxLength(200) }).optional(),
  });
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const brandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  brandName: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
  tagline: z.string().max(200, "Tagline too long").optional(),
});

export type BrandingFormData = z.infer<typeof brandingSchema>;
