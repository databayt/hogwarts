// Contact Step Validation

import { z } from 'zod';
import { FORM_LIMITS } from '../config.client';

export const contactSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(FORM_LIMITS.EMAIL_MAX_LENGTH, 'Email is too long'),
  phone: z
    .string()
    .min(FORM_LIMITS.PHONE_MIN_LENGTH, 'Phone number is too short')
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, 'Phone number is too long'),
  alternatePhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(FORM_LIMITS.ADDRESS_MAX_LENGTH, 'Address is too long'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(FORM_LIMITS.CITY_MAX_LENGTH, 'City name is too long'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(FORM_LIMITS.STATE_MAX_LENGTH, 'State name is too long'),
  postalCode: z
    .string()
    .max(FORM_LIMITS.POSTAL_CODE_MAX_LENGTH, 'Postal code is too long')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .min(1, 'Country is required')
});

export type ContactSchemaType = z.infer<typeof contactSchema>;
