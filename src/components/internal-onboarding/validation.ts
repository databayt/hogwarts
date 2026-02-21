import { z } from "zod"

// =============================================================================
// STEP SCHEMAS
// =============================================================================

export const personalSchema = z.object({
  givenName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50),
  middleName: z.string().max(50).optional().or(z.literal("")),
  surname: z.string().min(2, "Last name must be at least 2 characters").max(50),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  nationality: z.string().optional().or(z.literal("")),
  profilePhotoUrl: z.string().optional().or(z.literal("")),
})

export const contactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  emailVerified: z.boolean(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  emergencyContactRelation: z.string().optional().or(z.literal("")),
})

// Role-specific schemas
export const teacherDetailsSchema = z.object({
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  employmentType: z.string().min(1, "Employment type is required"),
  qualificationName: z.string().optional().or(z.literal("")),
  qualificationInstitution: z.string().optional().or(z.literal("")),
  qualificationYear: z.string().optional().or(z.literal("")),
})

export const staffDetailsSchema = z.object({
  departmentId: z.string().optional().or(z.literal("")),
  position: z.string().min(2, "Position is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  qualificationName: z.string().optional().or(z.literal("")),
  qualificationInstitution: z.string().optional().or(z.literal("")),
  qualificationYear: z.string().optional().or(z.literal("")),
})

export const adminDetailsSchema = z.object({
  departmentId: z.string().optional().or(z.literal("")),
  position: z.string().min(2, "Position is required"),
  administrativeArea: z.string().min(1, "Administrative area is required"),
})

export const studentDetailsSchema = z.object({
  gradeLevel: z.string().min(1, "Grade level is required"),
  previousSchool: z.string().optional().or(z.literal("")),
  previousGrade: z.string().optional().or(z.literal("")),
  studentType: z.string().min(1, "Student type is required"),
})

export const documentsSchema = z.object({
  documents: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        url: z.string(),
        uploadedAt: z.string(),
      })
    )
    .optional()
    .default([]),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type PersonalSchemaType = z.infer<typeof personalSchema>
export type ContactSchemaType = z.infer<typeof contactSchema>
export type TeacherDetailsSchemaType = z.infer<typeof teacherDetailsSchema>
export type StaffDetailsSchemaType = z.infer<typeof staffDetailsSchema>
export type AdminDetailsSchemaType = z.infer<typeof adminDetailsSchema>
export type StudentDetailsSchemaType = z.infer<typeof studentDetailsSchema>
export type DocumentsSchemaType = z.infer<typeof documentsSchema>
