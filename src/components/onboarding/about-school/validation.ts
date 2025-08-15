import { z } from 'zod'
import { PropertyType } from '@prisma/client'

export const aboutPlaceSchema = z.object({
  propertyType: z.nativeEnum(PropertyType, {
    required_error: 'Please select a property type',
  }),
})

export type AboutPlaceFormData = z.infer<typeof aboutPlaceSchema> 