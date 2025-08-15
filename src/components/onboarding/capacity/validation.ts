import { z } from 'zod'
import { FORM_LIMITS, ERROR_MESSAGES } from '../constants'

export const floorPlanSchema = z.object({
  teachers: z.number()
    .min(1, 'School must have at least 1 teacher')
    .max(200, 'Teacher count cannot exceed 200'),
  facilities: z.number()
    .min(1, 'School must have at least 1 facility')
    .max(50, 'Facilities count cannot exceed 50'),
  studentCount: z.number()
    .min(1, 'School must accommodate at least 1 student')
    .max(5000, 'Student count cannot exceed 5000'),
})

export type FloorPlanFormData = z.infer<typeof floorPlanSchema>