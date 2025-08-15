import { z } from 'zod'

export const locationSchema = z.object({
  address: z.string().min(1, 'Address is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  country: z.string().min(1, 'Country is required').trim(),
  postalCode: z.string().min(1, 'Postal code is required').trim(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export type LocationFormData = z.infer<typeof locationSchema> 