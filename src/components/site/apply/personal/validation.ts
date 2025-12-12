// Personal Step Validation

import { z } from 'zod';
import { FORM_LIMITS } from '../config.client';

export const personalSchema = z.object({
  firstName: z
    .string()
    .min(FORM_LIMITS.NAME_MIN_LENGTH, 'First name is too short')
    .max(FORM_LIMITS.NAME_MAX_LENGTH, 'First name is too long')
    .trim(),
  middleName: z
    .string()
    .max(FORM_LIMITS.NAME_MAX_LENGTH, 'Middle name is too long')
    .trim()
    .optional()
    .or(z.literal('')),
  lastName: z
    .string()
    .min(FORM_LIMITS.NAME_MIN_LENGTH, 'Last name is too short')
    .max(FORM_LIMITS.NAME_MAX_LENGTH, 'Last name is too long')
    .trim(),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Gender is required'
  }),
  nationality: z
    .string()
    .min(1, 'Nationality is required'),
  religion: z
    .string()
    .optional()
    .or(z.literal('')),
  category: z
    .string()
    .optional()
    .or(z.literal(''))
});

export type PersonalSchemaType = z.infer<typeof personalSchema>;
