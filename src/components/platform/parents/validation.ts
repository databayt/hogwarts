import { z } from "zod"

// ============================================================================
// Guardian Linking Schemas (StudentGuardian relationship)
// ============================================================================

export const linkGuardianSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  guardianId: z.string().min(1, "Guardian ID is required"),
  guardianTypeId: z.string().min(1, "Guardian type is required"),
  isPrimary: z.boolean().default(false),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  notes: z.string().optional(),
});

export const createGuardianAndLinkSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  givenName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  emailAddress: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  guardianType: z.string().min(1, "Guardian type is required"),
  isPrimary: z.boolean().default(false),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  notes: z.string().optional(),
});

export const updateGuardianLinkSchema = z.object({
  studentGuardianId: z.string().min(1, "Relationship ID is required"),
  guardianTypeId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  notes: z.string().optional(),
});

export const unlinkGuardianSchema = z.object({
  studentGuardianId: z.string().min(1, "Relationship ID is required"),
});

// ============================================================================
// Parent Base Schemas
// ============================================================================

export const parentBaseSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  emailAddress: z.string().email("Valid email is required").optional().or(z.literal("")),
  userId: z.string().optional(),
})

export const parentCreateSchema = parentBaseSchema

export const parentUpdateSchema = parentBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getParentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  emailAddress: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
