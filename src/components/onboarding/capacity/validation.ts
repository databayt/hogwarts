import { z } from 'zod'

export const capacitySchema = z.object({
  studentCount: z.number()
    .min(1, 'School must accommodate at least 1 student')
    .max(10000, 'Student count cannot exceed 10,000'),
  teachers: z.number()
    .min(1, 'School must have at least 1 teacher')
    .max(500, 'Teacher count cannot exceed 500'),
  classrooms: z.number()
    .min(1, 'School must have at least 1 classroom')
    .max(100, 'Classroom count cannot exceed 100'),
  facilities: z.number()
    .min(1, 'School must have at least 1 facility')
    .max(50, 'Facilities count cannot exceed 50'),
})

export type CapacityFormData = z.infer<typeof capacitySchema>