/**
 * Document Extraction Schemas
 * Zod schemas for validating extracted data from each onboarding step
 */

import { z } from 'zod'

// Title step extraction schema
export const titleExtractionSchema = z.object({
  schoolName: z.string().optional().describe('Official name of the school or educational institution'),
  subdomain: z.string().optional().describe('Proposed subdomain (lowercase, no spaces, letters and numbers only)'),
  tagline: z.string().optional().describe('School tagline or motto'),
})

// Description step extraction schema
export const descriptionExtractionSchema = z.object({
  mission: z.string().optional().describe('School mission statement'),
  vision: z.string().optional().describe('School vision statement'),
  values: z.array(z.string()).optional().describe('Core values of the institution'),
  description: z.string().optional().describe('General description or overview of the school'),
})

// Location step extraction schema
export const locationExtractionSchema = z.object({
  country: z.string().optional().describe('Country name'),
  state: z.string().optional().describe('State, province, or region'),
  city: z.string().optional().describe('City or town'),
  address: z.string().optional().describe('Street address'),
  postalCode: z.string().optional().describe('Postal or ZIP code'),
  phone: z.string().optional().describe('Primary phone number'),
  email: z.string().email().optional().describe('Primary email address'),
  website: z.string().url().optional().describe('School website URL'),
})

// Capacity step extraction schema
export const capacityExtractionSchema = z.object({
  totalStudents: z.number().int().positive().optional().describe('Total student enrollment capacity'),
  totalTeachers: z.number().int().positive().optional().describe('Total number of teachers or faculty'),
  totalClasses: z.number().int().positive().optional().describe('Total number of classes or classrooms'),
  maxClassSize: z.number().int().positive().optional().describe('Maximum students per class'),
  facilities: z.array(z.string()).optional().describe('List of facilities (library, lab, gym, etc.)'),
})

// Price step extraction schema
export const priceExtractionSchema = z.object({
  currency: z.string().length(3).optional().describe('Currency code (ISO 4217, e.g., USD, EUR)'),
  tuitionFee: z.number().positive().optional().describe('Annual or semester tuition fee'),
  registrationFee: z.number().positive().optional().describe('One-time registration fee'),
  otherFees: z.array(
    z.object({
      name: z.string().describe('Fee name (e.g., Lab Fee, Technology Fee)'),
      amount: z.number().positive().describe('Fee amount'),
      frequency: z.string().optional().describe('Payment frequency (monthly, annual, one-time)'),
    })
  ).optional().describe('Other fees and charges'),
})

// Map onboarding steps to their extraction schemas
export const stepSchemaMap = {
  title: titleExtractionSchema,
  description: descriptionExtractionSchema,
  location: locationExtractionSchema,
  capacity: capacityExtractionSchema,
  price: priceExtractionSchema,
  // Steps without extraction (use generic schema)
  branding: z.object({}),
  import: z.object({}),
  legal: z.object({}),
} as const

export type StepSchemaMap = typeof stepSchemaMap
export type SchemaForStep<T extends keyof StepSchemaMap> = z.infer<StepSchemaMap[T]>
