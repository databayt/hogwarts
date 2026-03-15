// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Single source of truth: composed from wizard step schemas.
// Individual step schemas live in ./wizard/*/validation.ts

import { z } from "zod"

import { contactSchema, phoneNumberSchema } from "./wizard/contact/validation"
import { experienceItemSchema } from "./wizard/experience/validation"
import { expertiseItemSchema } from "./wizard/expertise/validation"
import { informationSchema } from "./wizard/information/validation"
import { photoSchema } from "./wizard/photo/validation"
import { qualificationsSchema } from "./wizard/qualifications/validation"

// Re-export individual schemas for consumers (CSV import, onboarding, etc.)
export { phoneNumberSchema } from "./wizard/contact/validation"
export { qualificationsSchema } from "./wizard/qualifications/validation"
export { experienceItemSchema as experienceSchema } from "./wizard/experience/validation"
export { expertiseItemSchema as subjectExpertiseSchema } from "./wizard/expertise/validation"

// Composed full schema — merges flat fields from wizard steps.
// Wizard step schemas with .refine() (employment) can't be merged,
// so we inline the employment fields and add cross-field refinements here.
export const teacherCreateSchema = photoSchema
  .merge(informationSchema)
  .merge(contactSchema)
  .extend({
    // Employment fields (from wizard/employment/validation.ts)
    employeeId: z.string().optional(),
    joiningDate: z.coerce.date().optional(),
    employmentStatus: z
      .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RETIRED"])
      .default("ACTIVE"),
    employmentType: z
      .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "SUBSTITUTE"])
      .default("FULL_TIME"),
    contractStartDate: z.coerce.date().optional(),
    contractEndDate: z.coerce.date().optional(),
    // Nested arrays
    qualifications: z.array(qualificationsSchema).optional().default([]),
    experiences: z.array(experienceItemSchema).optional().default([]),
    subjectExpertise: z.array(expertiseItemSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.contractStartDate && data.contractEndDate) {
        return data.contractStartDate < data.contractEndDate
      }
      return true
    },
    {
      message: "Contract start date must be before end date",
      path: ["contractEndDate"],
    }
  )
  .refine(
    (data) => {
      if (data.birthDate && data.joiningDate) {
        return data.birthDate < data.joiningDate
      }
      return true
    },
    {
      message: "Birth date must be before joining date",
      path: ["joiningDate"],
    }
  )

export const teacherUpdateSchema = informationSchema
  .merge(contactSchema)
  .extend({
    employeeId: z.string().optional(),
    joiningDate: z.coerce.date().optional(),
    employmentStatus: z
      .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RETIRED"])
      .optional(),
    employmentType: z
      .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "SUBSTITUTE"])
      .optional(),
    contractStartDate: z.coerce.date().optional(),
    contractEndDate: z.coerce.date().optional(),
    qualifications: z.array(qualificationsSchema).optional(),
    experiences: z.array(experienceItemSchema).optional(),
    subjectExpertise: z.array(expertiseItemSchema).optional(),
  })
  .partial()
  .extend({
    id: z.string().min(1, "Required"),
  })

// Class teacher assignment schema (for co-teaching)
export const classTeacherSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  role: z.enum(["PRIMARY", "CO_TEACHER", "ASSISTANT"]).default("PRIMARY"),
})

// Workload configuration schema
export const workloadConfigSchema = z
  .object({
    schoolId: z.string().min(1, "School ID is required"),
    minPeriodsPerWeek: z.number().int().min(1).max(50).default(15),
    normalPeriodsPerWeek: z.number().int().min(1).max(50).default(20),
    maxPeriodsPerWeek: z.number().int().min(1).max(50).default(25),
    overloadThreshold: z.number().int().min(1).max(50).default(25),
  })
  .refine(
    (data) => {
      return (
        data.minPeriodsPerWeek <= data.normalPeriodsPerWeek &&
        data.normalPeriodsPerWeek <= data.maxPeriodsPerWeek &&
        data.maxPeriodsPerWeek <= data.overloadThreshold
      )
    },
    {
      message:
        "Thresholds must be in ascending order: min <= normal <= max <= overload",
      path: ["overloadThreshold"],
    }
  )

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getTeachersSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  emailAddress: z.string().optional().default(""),
  status: z.string().optional().default(""),
  employmentStatus: z.string().optional().default(""),
  employmentType: z.string().optional().default(""),
  departmentId: z.string().optional().default(""),
  subjectId: z.string().optional().default(""),
  workloadStatus: z.enum(["UNDERUTILIZED", "NORMAL", "OVERLOAD"]).optional(),
  sort: z.array(sortItemSchema).optional().default([]),
})
