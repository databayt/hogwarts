/**
 * Validation schemas for the Sales/Leads feature
 * Zod schemas for runtime validation and type inference
 */

import { z } from 'zod';
import {
  LEAD_STATUS,
  LEAD_SOURCE,
  LEAD_PRIORITY,
  LEAD_TYPE,
} from './constants';

// Lead creation schema
export const createLeadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  email: z
    .string()
    .email('Invalid email address')
    .transform((val) => val?.toLowerCase())
    .optional()
    .or(z.literal('')),

  phone: z.string().optional().or(z.literal('')),

  alternatePhone: z.string().optional().or(z.literal('')),

  company: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .trim()
    .optional(),

  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),

  website: z.string().url('Invalid URL').optional().or(z.literal('')),

  linkedinUrl: z.string().optional().or(z.literal('')),

  leadType: z
    .enum(Object.keys(LEAD_TYPE) as [string, ...string[]])
    .default('SCHOOL'),

  industry: z
    .string()
    .max(50, 'Industry must be less than 50 characters')
    .optional(),

  location: z.string().max(100).optional(),

  country: z.string().max(50).optional(),

  status: z
    .enum(Object.keys(LEAD_STATUS) as [string, ...string[]])
    .default('NEW'),

  source: z
    .enum(Object.keys(LEAD_SOURCE) as [string, ...string[]])
    .default('MANUAL'),

  priority: z
    .enum(Object.keys(LEAD_PRIORITY) as [string, ...string[]])
    .default('MEDIUM'),

  score: z
    .number()
    .min(0, 'Score must be between 0 and 100')
    .max(100, 'Score must be between 0 and 100')
    .default(50),

  verified: z.boolean().default(false),

  assignedToId: z.string().optional().nullable(),

  lastContactedAt: z.coerce.date().optional().nullable(),

  nextFollowUpAt: z.coerce.date().optional().nullable(),

  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional(),

  tags: z
    .array(z.string().max(30))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
});

// Lead update schema (all fields optional)
export const updateLeadSchema = createLeadSchema.partial();

// Bulk update schema
export const bulkUpdateSchema = z.object({
  leadIds: z
    .array(z.string())
    .min(1, 'At least one lead must be selected')
    .max(100, 'Maximum 100 leads can be updated at once'),

  updates: z
    .object({
      status: z
        .enum(Object.keys(LEAD_STATUS) as [string, ...string[]])
        .optional(),
      priority: z
        .enum(Object.keys(LEAD_PRIORITY) as [string, ...string[]])
        .optional(),
      score: z.number().min(0).max(100).optional(),
      assignedToId: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      addTags: z.array(z.string()).optional(),
      removeTags: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be updated',
    }),
});

// Lead filter schema
export const leadFilterSchema = z
  .object({
    search: z.string().optional(),
    status: z
      .enum(Object.keys(LEAD_STATUS) as [string, ...string[]])
      .optional(),
    source: z
      .enum(Object.keys(LEAD_SOURCE) as [string, ...string[]])
      .optional(),
    priority: z
      .enum(Object.keys(LEAD_PRIORITY) as [string, ...string[]])
      .optional(),
    leadType: z.enum(Object.keys(LEAD_TYPE) as [string, ...string[]]).optional(),
    scoreMin: z.number().min(0).max(100).optional(),
    scoreMax: z.number().min(0).max(100).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    assignedToId: z.string().optional(),
    verified: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.scoreMin !== undefined && data.scoreMax !== undefined) {
        return data.scoreMin <= data.scoreMax;
      }
      return true;
    },
    {
      message: 'Minimum score must be less than or equal to maximum score',
      path: ['scoreMin'],
    }
  );

// Lead activity schema
export const leadActivitySchema = z.object({
  leadId: z.string(),

  type: z.enum([
    'email_sent',
    'call',
    'meeting',
    'note',
    'status_change',
  ]),

  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),

  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Export configuration schema
export const exportConfigSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),

  fields: z
    .array(z.string())
    .min(1, 'At least one field must be selected for export'),

  filters: leadFilterSchema.optional(),

  options: z
    .object({
      includeHeaders: z.boolean().default(true),
      dateFormat: z.enum(['iso', 'us', 'eu']).default('iso'),
      delimiter: z.enum([',', ';', '\t']).default(','),
    })
    .optional(),
});

// Type exports from schemas
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
export type LeadActivityInput = z.infer<typeof leadActivitySchema>;
export type ExportConfigInput = z.infer<typeof exportConfigSchema>;
