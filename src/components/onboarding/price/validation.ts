import { z } from 'zod'

// Updated for school pricing context
export const schoolPriceSchema = z.object({
  tuitionFee: z.number()
    .min(0, "Tuition fee cannot be negative")
    .max(50000, "Tuition fee cannot exceed $50,000"),
  registrationFee: z.number()
    .min(0, "Registration fee cannot be negative")
    .max(5000, "Registration fee cannot exceed $5,000")
    .optional(),
  applicationFee: z.number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee cannot exceed $1,000")
    .optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'], {
    required_error: "Please select a currency",
  }).default('USD'),
  paymentSchedule: z.enum(['monthly', 'quarterly', 'semester', 'annual'], {
    required_error: "Please select a payment schedule",
  }).default('monthly'),
})

export type SchoolPriceFormData = z.infer<typeof schoolPriceSchema>

// Keep legacy schema for backward compatibility
export const priceSchema = schoolPriceSchema
export type PriceFormData = SchoolPriceFormData 