// Academic Step Validation

import { z } from 'zod';
import { FORM_LIMITS } from '../config.client';

export const academicSchema = z.object({
  previousSchool: z
    .string()
    .max(100, 'School name is too long')
    .optional()
    .or(z.literal('')),
  previousClass: z
    .string()
    .max(50, 'Class name is too long')
    .optional()
    .or(z.literal('')),
  previousMarks: z
    .string()
    .max(20, 'Marks value is too long')
    .optional()
    .or(z.literal('')),
  previousPercentage: z
    .string()
    .max(10, 'Percentage value is too long')
    .optional()
    .or(z.literal('')),
  achievements: z
    .string()
    .max(FORM_LIMITS.ACHIEVEMENTS_MAX_LENGTH, 'Achievements text is too long')
    .optional()
    .or(z.literal('')),
  applyingForClass: z
    .string()
    .min(1, 'Applying class is required'),
  preferredStream: z
    .string()
    .optional()
    .or(z.literal('')),
  secondLanguage: z
    .string()
    .optional()
    .or(z.literal('')),
  thirdLanguage: z
    .string()
    .optional()
    .or(z.literal(''))
});

export type AcademicSchemaType = z.infer<typeof academicSchema>;
