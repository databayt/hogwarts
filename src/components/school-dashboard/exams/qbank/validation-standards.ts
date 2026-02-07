/**
 * Curriculum Standards Validation
 *
 * Validation schemas for linking curriculum standards to questions.
 * Supports hierarchical standards (e.g., MATH.6 → MATH.6.NS → MATH.6.NS.1)
 * and aligning questions to educational frameworks (Common Core, NGSS, IB, etc.)
 *
 * Key patterns:
 * - Unique codes: Each standard has a unique code within a school
 * - Hierarchy: Standards can have parent/child relationships
 * - Frameworks: Support multiple frameworks (Common Core, NGSS, IB, custom)
 * - Multi-subject: Standards can span multiple subjects
 * - Active status: Inactive standards hidden from selection but preserved for history
 */

import { z } from "zod"

// ========== Curriculum Standard Schemas ==========

export const curriculumStandardSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9._-]+$/,
      "Code must contain only uppercase letters, numbers, dots, underscores, and hyphens"
    ),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  domain: z
    .string()
    .max(100, "Domain must be 100 characters or less")
    .optional(),
  gradeLevel: z
    .string()
    .max(20, "Grade level must be 20 characters or less")
    .optional(),
  subjectArea: z
    .string()
    .max(100, "Subject area must be 100 characters or less")
    .optional(),
  framework: z
    .string()
    .min(1, "Framework is required")
    .max(50, "Framework must be 50 characters or less")
    .default("custom"),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  lang: z.string().length(2, "Language must be 2 characters").default("ar"),
})

export type CurriculumStandardSchema = z.infer<typeof curriculumStandardSchema>

// ========== Update Standard Schema ==========

export const updateCurriculumStandardSchema = curriculumStandardSchema
  .partial()
  .extend({
    id: z.string().min(1, "Standard ID is required"),
  })

export type UpdateCurriculumStandardSchema = z.infer<
  typeof updateCurriculumStandardSchema
>

// ========== Link Questions to Standards Schema ==========

export const linkQuestionToStandardsSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  standardIds: z
    .array(z.string())
    .min(0, "Standards array is required")
    .max(20, "Maximum 20 standards per question"),
})

export type LinkQuestionToStandardsSchema = z.infer<
  typeof linkQuestionToStandardsSchema
>

// ========== Filter Standards Schema ==========

export const standardFiltersSchema = z.object({
  subjectArea: z.string().optional(),
  gradeLevel: z.string().optional(),
  framework: z.string().optional(),
  parentId: z.string().optional(),
  domain: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
})

export type StandardFiltersSchema = z.infer<typeof standardFiltersSchema>

// ========== Helper Functions ==========

/**
 * Validate standard code format
 * Expected format: SUBJECT.GRADE[.DOMAIN[.SUBDOMAIN]]
 * Examples: MATH.6, MATH.6.NS, MATH.6.NS.1, SCI.8.PS.2
 */
export function isValidStandardCode(code: string): boolean {
  const parts = code.split(".")
  if (parts.length < 2 || parts.length > 5) return false
  return parts.every((part) => /^[A-Z0-9_-]+$/.test(part))
}

/**
 * Extract grade level from standard code
 * MATH.6.NS.1 → "6"
 * SCI.K-2.PS → "K-2"
 */
export function extractGradeFromCode(code: string): string | null {
  const parts = code.split(".")
  if (parts.length < 2) return null
  const gradePart = parts[1]
  if (/^\d+$/.test(gradePart)) return gradePart
  if (/^[KP]$/.test(gradePart)) return gradePart
  if (/^\d+-\d+$/.test(gradePart)) return gradePart
  if (/^[KP]-\d+$/.test(gradePart)) return gradePart
  return null
}

/**
 * Extract subject from standard code
 * MATH.6.NS.1 → "MATH"
 */
export function extractSubjectFromCode(code: string): string | null {
  const parts = code.split(".")
  return parts.length > 0 ? parts[0] : null
}

/**
 * Check if a standard is a child of another
 * MATH.6.NS.1 is child of MATH.6.NS
 */
export function isChildStandard(
  childCode: string,
  parentCode: string
): boolean {
  return childCode.startsWith(parentCode + ".")
}
