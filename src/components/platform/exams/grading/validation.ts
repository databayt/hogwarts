/**
 * Grading System Validation Schemas
 *
 * Zod schemas for:
 * - Grade configuration
 * - Grade boundaries
 * - CGPA calculations
 */

import { z } from "zod"

// Grade boundary schema
export const gradeBoundarySchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
  gpa4: z.number().min(0).max(4),
  gpa5: z.number().min(0).max(5),
})

// School grading configuration schema
export const gradingConfigSchema = z.object({
  primarySystem: z.enum([
    "PERCENTAGE",
    "GPA_4",
    "GPA_5",
    "LETTER",
    "CGPA",
    "CCE",
    "CBSE",
    "ICSE",
  ]),
  gpaScale: z.number().min(4).max(5).default(4),
  showPercentage: z.boolean().default(true),
  showGPA: z.boolean().default(true),
  showLetter: z.boolean().default(true),
  passingThreshold: z.number().min(0).max(100).default(60),
  cgpaWeighting: z
    .object({
      midterm: z.number().min(0).max(1).optional(),
      final: z.number().min(0).max(1).optional(),
      quiz: z.number().min(0).max(1).optional(),
      assignment: z.number().min(0).max(1).optional(),
      practical: z.number().min(0).max(1).optional(),
      project: z.number().min(0).max(1).optional(),
    })
    .optional(),
  customBoundaries: z.array(gradeBoundarySchema).optional(),
  retakePolicy: z.enum(["best", "latest", "average"]).default("best"),
  maxRetakes: z.number().min(0).max(5).default(2),
  retakePenaltyPercent: z.number().min(0).max(50).default(0),
})

// Grade conversion request schema
export const gradeConversionSchema = z.object({
  value: z.union([z.number(), z.string()]),
  fromSystem: z.enum([
    "PERCENTAGE",
    "GPA_4",
    "GPA_5",
    "LETTER",
    "CGPA",
    "CCE",
    "CBSE",
    "ICSE",
  ]),
  toSystem: z.enum([
    "PERCENTAGE",
    "GPA_4",
    "GPA_5",
    "LETTER",
    "CGPA",
    "CCE",
    "CBSE",
    "ICSE",
  ]),
})

// CGPA calculation request schema
export const cgpaCalculationSchema = z.object({
  semesters: z.array(
    z.object({
      semesterId: z.string(),
      semesterName: z.string(),
      courses: z.array(
        z.object({
          courseId: z.string(),
          courseName: z.string(),
          creditHours: z.number().min(0).max(10),
          percentage: z.number().min(0).max(100),
          gradePoint: z.number().optional(),
          isRetake: z.boolean().optional(),
          attemptNumber: z.number().optional(),
        })
      ),
    })
  ),
  gpaScale: z.enum(["4", "5"]).transform((val) => parseInt(val) as 4 | 5),
  retakePolicy: z.enum(["best", "latest", "average"]),
  includeCurrentSemester: z.boolean().default(true),
})

// Target GPA calculation schema
export const targetGPASchema = z.object({
  currentCGPA: z.number().min(0).max(5),
  currentCredits: z.number().min(0),
  targetCGPA: z.number().min(0).max(5),
  remainingCredits: z.number().min(1),
})

// Export types
export type GradeBoundaryInput = z.infer<typeof gradeBoundarySchema>
export type GradingConfigInput = z.infer<typeof gradingConfigSchema>
export type GradeConversionInput = z.infer<typeof gradeConversionSchema>
export type CGPACalculationInput = z.infer<typeof cgpaCalculationSchema>
export type TargetGPAInput = z.infer<typeof targetGPASchema>
