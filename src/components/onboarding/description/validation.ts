import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants'

export const descriptionSchema = z.object({
  description: z.string()
    .min(FORM_LIMITS.DESCRIPTION_MIN_LENGTH, ERROR_MESSAGES.DESCRIPTION_TOO_SHORT)
    .max(FORM_LIMITS.DESCRIPTION_MAX_LENGTH, ERROR_MESSAGES.DESCRIPTION_TOO_LONG)
    .trim(),
})

export type DescriptionFormData = z.infer<typeof descriptionSchema> 