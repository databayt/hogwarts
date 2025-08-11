import { z } from 'zod'

export const schoolSettingsSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1).default('Africa/Khartoum'),
  locale: z.enum(['ar', 'en']).default('ar'),
  logoUrl: z.string().url().optional().or(z.literal('')),
})

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>







