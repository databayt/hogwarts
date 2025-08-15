import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants'

export const titleSchema = z.object({
  title: z.string()
    .min(FORM_LIMITS.TITLE_MIN_LENGTH, ERROR_MESSAGES.TITLE_TOO_SHORT)
    .max(FORM_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
})

export type TitleFormData = z.infer<typeof titleSchema> 