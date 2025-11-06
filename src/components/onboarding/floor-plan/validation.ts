import { z } from 'zod';
import { getValidationMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createFloorPlanSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    teachers: z.number().min(1, { message: v.get('atLeastOneTeacher') }),
    facilities: z.number().min(1, { message: v.get('atLeastOneFacility') }),
    studentCount: z.number().min(1, { message: v.get('atLeastOneStudent') }),
  });
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const floorPlanSchema = z.object({
  teachers: z.number().min(1, 'At least 1 teacher is required'),
  facilities: z.number().min(1, 'At least 1 facility is required'),
  studentCount: z.number().min(1, 'At least 1 student is required'),
});

export type FloorPlanFormData = z.infer<typeof floorPlanSchema>;
