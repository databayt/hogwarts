import { z } from 'zod';

export const floorPlanSchema = z.object({
  teachers: z.number().min(1, 'At least 1 teacher is required'),
  facilities: z.number().min(1, 'At least 1 facility is required'),
  studentCount: z.number().min(1, 'At least 1 student is required'),
});

export type FloorPlanFormData = z.infer<typeof floorPlanSchema>;
