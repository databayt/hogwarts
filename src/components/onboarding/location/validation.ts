import { z } from 'zod'
import { getValidationMessages } from '@/components/internationalization/helpers'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createLocationSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    address: z.string().min(1, { message: v.get('addressRequired') }).trim(),
    city: z.string().min(1, { message: v.get('cityRequired') }).trim(),
    state: z.string().min(1, { message: v.get('stateRequired') }).trim(),
    country: z.string().min(1, { message: v.get('countryRequired') }).trim(),
    postalCode: z.string().optional().default(""),
    latitude: z.number().optional().default(0),
    longitude: z.number().optional().default(0),
  });
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const locationSchema = z.object({
  address: z.string().min(1, 'Address is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  country: z.string().min(1, 'Country is required').trim(),
  postalCode: z.string().optional().default(""),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
})

export type LocationFormData = z.infer<typeof locationSchema>