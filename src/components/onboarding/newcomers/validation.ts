import { z } from "zod"

/**
 * Newcomers Onboarding Validation Schemas
 */

// Step 1: Role Selection
export const roleStepSchema = z.object({
  role: z.enum(["teacher", "staff", "parent", "student"], {
    message: "Please select a role",
  }),
})

// Step 2: Basic Information
export const infoStepSchema = z.object({
  givenName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  surname: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
})

// Step 3: Email Verification
export const verifyStepSchema = z.object({
  verificationCode: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must be numeric"),
})

// Step 4: Profile (base - extended per role)
export const profileStepSchema = z.object({
  // Common fields
  dateOfBirth: z.string().optional(),

  // Teacher fields
  subjects: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  qualifications: z.string().optional(),

  // Parent fields
  relationship: z.string().optional(),
  childName: z.string().optional(),
  childGrade: z.string().optional(),

  // Student fields
  gradeLevel: z.string().optional(),
  previousSchool: z.string().optional(),

  // Staff fields
  department: z.string().optional(),
  position: z.string().optional(),
})

// Teacher-specific profile
export const teacherProfileSchema = profileStepSchema.extend({
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  yearsExperience: z.number().min(0, "Experience cannot be negative"),
})

// Parent-specific profile
export const parentProfileSchema = profileStepSchema.extend({
  relationship: z.string().min(1, "Please select your relationship"),
  childName: z.string().min(2, "Please enter your child's name"),
})

// Student-specific profile
export const studentProfileSchema = profileStepSchema.extend({
  gradeLevel: z.string().min(1, "Please select your grade level"),
  dateOfBirth: z.string().min(1, "Please enter your date of birth"),
})

// Staff-specific profile
export const staffProfileSchema = profileStepSchema.extend({
  department: z.string().min(1, "Please select your department"),
  position: z.string().min(2, "Please enter your position"),
})

// Combined schema for all steps
export const newcomerFormSchema = z.object({
  ...roleStepSchema.shape,
  ...infoStepSchema.shape,
  ...verifyStepSchema.shape,
  ...profileStepSchema.shape,
})

export type NewcomerFormData = z.infer<typeof newcomerFormSchema>
export type RoleStepData = z.infer<typeof roleStepSchema>
export type InfoStepData = z.infer<typeof infoStepSchema>
export type VerifyStepData = z.infer<typeof verifyStepSchema>
export type ProfileStepData = z.infer<typeof profileStepSchema>
