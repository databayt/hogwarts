import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants'

export const priceSchema = z.object({
  pricePerNight: z.number()
    .min(FORM_LIMITS.MIN_PRICE, ERROR_MESSAGES.PRICE_TOO_LOW)
    .max(FORM_LIMITS.MAX_PRICE, ERROR_MESSAGES.PRICE_TOO_HIGH),
  securityDeposit: z.number()
    .min(0, 'Security deposit cannot be negative')
    .optional(),
  applicationFee: z.number()
    .min(0, 'Application fee cannot be negative')
    .optional(),
})

export type PriceFormData = z.infer<typeof priceSchema> 