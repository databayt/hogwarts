import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants.client'

export const titleSchema = z.object({
  title: z.string()
    .min(FORM_LIMITS.TITLE_MIN_LENGTH, ERROR_MESSAGES.TITLE_TOO_SHORT)
    .max(FORM_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be no more than 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Cannot start or end with hyphen')
    .optional(),
})

export type TitleFormData = z.infer<typeof titleSchema> 