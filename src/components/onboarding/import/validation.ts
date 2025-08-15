import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants'

export const photosSchema = z.object({
  photoUrls: z.array(z.string().url())
    .min(1, 'At least one photo is required')
    .max(FORM_LIMITS.MAX_PHOTOS, ERROR_MESSAGES.TOO_MANY_PHOTOS),
})

export type PhotosFormData = z.infer<typeof photosSchema> 