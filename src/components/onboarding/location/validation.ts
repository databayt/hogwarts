import { z } from 'zod'

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