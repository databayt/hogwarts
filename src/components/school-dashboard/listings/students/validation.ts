// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Single source of truth for the full Student record schema used by non-wizard
// create/update paths (REST-style actions, tests, imports). The wizard itself
// composes smaller per-step schemas from `./wizard/*/validation.ts`.
//
// Fields are flattened here (not imported from wizard) so that retiring wizard
// steps doesn't break callers that need the full Student shape.

import { z } from "zod"

export const studentCreateSchema = z.object({
  // Photo
  profilePhotoUrl: z.string().optional(),
  // Personal — names are optional in the composed schema so non-wizard
  // entry points (imports, partial updates) accept incomplete data. The
  // wizard's per-step `personalStudentSchema` enforces them strictly.
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female"] as const).optional(),
  nationality: z.string().optional(),
  // Contact
  email: z.string().email().optional().or(z.literal("")),
  mobileNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  // Location
  currentAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Enrollment
  enrollmentDate: z.coerce.date().optional(),
  admissionNumber: z.string().optional(),
  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "GRADUATED",
      "TRANSFERRED",
      "DROPPED_OUT",
    ])
    .optional(),
  studentType: z
    .enum(["REGULAR", "TRANSFER", "INTERNATIONAL", "EXCHANGE"])
    .optional(),
  category: z.string().optional(),
  academicGradeId: z.string().optional(),
  academicStreamId: z.string().optional(),
  sectionId: z.string().optional(),
  // Health (columns preserved; UI retired — see issue #265)
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medicationRequired: z.string().optional(),
  doctorName: z.string().optional(),
  doctorContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  // Previous education
  previousSchoolName: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  previousGrade: z.string().optional(),
  transferCertificateNo: z.string().optional(),
  transferDate: z.coerce.date().optional(),
  previousAcademicRecord: z.string().optional(),
  // System
  userId: z.string().optional(),
})

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  id: z.string().min(1),
})

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getStudentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  className: z.string().optional().default(""),
  status: z.string().optional().default(""),
  scope: z.enum(["active", "archived", "all"]).optional().default("active"),
  sort: z.array(sortItemSchema).optional().default([]),
  // UI locale from the ROUTE ([lang] segment) — the only reliable source of truth.
  // The client table passes this so search/load-more translate to the same language
  // as the initial server render (the NEXT_LOCALE cookie can disagree with the URL).
  lang: z.enum(["ar", "en"]).optional(),
})
