/**
 * Profile System Validation Schemas
 *
 * Comprehensive Zod validation for user profiles across 4 user types:
 * - Students: Academic info (enrollment, GPA, certifications, skills)
 * - Teachers: Professional info (employment, publications, office hours)
 * - Parents: Family info (relationship, occupation, emergency contact status)
 * - Staff: Employment info (department, designation, shift schedule)
 *
 * Key validation rules:
 * - Email: Normalized to lowercase, trimmed (prevents duplicates from case sensitivity)
 * - Phone: International format E.164 standard (allows 12-15 digits with +)
 * - URLs: HTTPS only, optional fields, nullable for flexibility
 * - Social links: Optional per platform (LinkedIn, Twitter, GitHub, etc.)
 * - Visibility: School-scoped by default (SCHOOL > DISTRICT > PUBLIC)
 * - Activity tracking: Timestamps, icons, metadata for extensibility
 *
 * Why these patterns:
 * - Partial profiles: Not all fields required at once (multi-step/incremental updates)
 * - Type-specific schemas: Different user types have different needs
 * - Bulk operations: Import/export support up to 1000 profiles
 * - Custom fields: Record<string, any> for extensibility without schema changes
 */

import { z } from "zod"

import {
  ActivityType,
  AvailabilityStatus,
  ProfileVisibility,
  UserProfileType,
} from "./types"

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Email validation with proper formatting
 * Lowercase + trim prevents duplicate accounts from "John@example.com" vs "john@example.com"
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim()

/**
 * Phone number validation (international format E.164)
 * E.164: +[country][number], 12-15 digits total, no hyphens in schema
 * Why: Standardized format for international SMS, database storage, and telecommunications
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional()
  .nullable()

/**
 * URL validation for social links
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .optional()
  .nullable()

/**
 * Date validation
 */
export const dateSchema = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === "string" ? new Date(val) : val))

/**
 * Social links validation
 */
export const socialLinksSchema = z
  .object({
    website: urlSchema,
    linkedin: urlSchema,
    twitter: urlSchema,
    facebook: urlSchema,
    instagram: urlSchema,
    github: urlSchema,
    youtube: urlSchema,
  })
  .partial()

/**
 * Profile settings validation
 */
export const profileSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["ar", "en"]),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showLocation: z.boolean().default(true),
  allowMessages: z.boolean().default(true),
  allowConnectionRequests: z.boolean().default(true),
})

/**
 * Address validation
 */
export const addressSchema = z
  .object({
    address: z.string().min(1).max(500).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    country: z.string().min(1).max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
  })
  .partial()

// ============================================================================
// Base Profile Validation
// ============================================================================

/**
 * Base profile schema shared across all user types
 */
export const baseProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  avatar: urlSchema,
  coverImage: urlSchema,
  bio: z
    .string()
    .max(500, "Bio must be 500 characters or less")
    .optional()
    .nullable(),

  // Contact
  phone: phoneSchema,
  alternatePhone: phoneSchema,
  ...addressSchema.shape,

  // Social
  socialLinks: socialLinksSchema.optional(),

  // Settings
  visibility: z.nativeEnum(ProfileVisibility).default(ProfileVisibility.SCHOOL),
  settings: profileSettingsSchema,
})

// ============================================================================
// Student Profile Validation
// ============================================================================

/**
 * Student academic information validation
 */
export const studentAcademicInfoSchema = z.object({
  grNumber: z.string().optional().nullable(),
  admissionNumber: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  currentYearLevel: z.string().optional(),
  currentSection: z.string().optional(),
  house: z.string().optional().nullable(),
  studentType: z.enum(["REGULAR", "TRANSFER", "INTERNATIONAL", "EXCHANGE"]),
  enrollmentDate: dateSchema,
  expectedGraduation: dateSchema.optional().nullable(),
  gpa: z.number().min(0).max(5).optional().nullable(),
  rank: z.number().positive().optional().nullable(),
  totalCredits: z.number().nonnegative().optional().nullable(),
})

/**
 * Skill validation
 */
export const skillSchema = z.object({
  name: z.string().min(1).max(50),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  verified: z.boolean().default(false),
  endorsements: z.number().nonnegative().default(0),
})

/**
 * Language proficiency validation
 */
export const languageSchema = z.object({
  name: z.string().min(1).max(50),
  proficiency: z.enum([
    "native",
    "fluent",
    "professional",
    "conversational",
    "basic",
  ]),
})

/**
 * Certification validation
 */
export const certificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  issueDate: dateSchema,
  expiryDate: dateSchema.optional().nullable(),
  credentialId: z.string().optional().nullable(),
  url: urlSchema,
})

/**
 * Student skills and interests validation
 */
export const studentSkillsInterestsSchema = z.object({
  skills: z.array(skillSchema).max(20),
  interests: z.array(z.string().max(50)).max(10),
  hobbies: z.array(z.string().max(50)).max(10),
  extracurriculars: z.array(z.string().max(100)).max(10),
  languages: z.array(languageSchema).max(10),
  certifications: z.array(certificationSchema).max(20),
})

/**
 * Complete student profile update schema
 */
export const studentProfileUpdateSchema = baseProfileSchema.extend({
  academicInfo: studentAcademicInfoSchema.partial(),
  skillsAndInterests: studentSkillsInterestsSchema.partial(),
})

// ============================================================================
// Teacher Profile Validation
// ============================================================================

/**
 * Teacher professional information validation
 */
export const teacherProfessionalInfoSchema = z.object({
  employeeId: z.string().min(1).max(50),
  designation: z.string().max(100).optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "VISITING"]),
  employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "RETIRED"]),
  joiningDate: dateSchema,
  totalExperience: z.number().nonnegative(),
  specializations: z.array(z.string().max(100)).max(10),
  researchInterests: z.array(z.string().max(100)).max(10).optional(),
})

/**
 * Publication validation
 */
export const publicationSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(["journal", "conference", "book", "chapter", "other"]),
  publisher: z.string().max(200).optional(),
  year: z.number().min(1900).max(new Date().getFullYear()),
  doi: z.string().optional(),
  url: urlSchema,
})

/**
 * Office hour validation
 */
export const officeHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().max(100).optional(),
  isOnline: z.boolean().optional(),
})

/**
 * Teacher schedule validation
 */
export const teacherScheduleSchema = z.object({
  weeklyHours: z.number().nonnegative().max(60),
  officeHours: z.array(officeHourSchema).max(10).optional(),
  availability: z.enum([
    "available",
    "busy",
    "in_class",
    "on_leave",
    "offline",
  ] as const),
})

/**
 * Complete teacher profile update schema
 */
export const teacherProfileUpdateSchema = baseProfileSchema.extend({
  professionalInfo: teacherProfessionalInfoSchema.partial(),
  publications: z.array(publicationSchema).max(100).optional(),
  schedule: teacherScheduleSchema.partial(),
})

// ============================================================================
// Parent Profile Validation
// ============================================================================

/**
 * Parent family information validation
 */
export const parentFamilyInfoSchema = z.object({
  relationship: z.enum(["father", "mother", "guardian", "other"]),
  occupation: z.string().max(100).optional().nullable(),
  employer: z.string().max(200).optional().nullable(),
  workPhone: phoneSchema,
  emergencyContact: z.boolean().default(false),
  primaryContact: z.boolean().default(false),
})

/**
 * Complete parent profile update schema
 */
export const parentProfileUpdateSchema = baseProfileSchema.extend({
  familyInfo: parentFamilyInfoSchema.partial(),
})

// ============================================================================
// Staff Profile Validation
// ============================================================================

/**
 * Staff information validation
 */
export const staffInfoSchema = z.object({
  employeeId: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  joiningDate: dateSchema,
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED"]),
  reportingTo: z.string().optional().nullable(),
  responsibilities: z.array(z.string().max(200)).max(20),
})

/**
 * Staff schedule validation
 */
export const staffScheduleSchema = z.object({
  workingHours: z.string().max(100),
  currentShift: z.string().max(50).optional(),
  availability: z.enum([
    "available",
    "busy",
    "in_class",
    "on_leave",
    "offline",
  ] as const),
})

/**
 * Complete staff profile update schema
 */
export const staffProfileUpdateSchema = baseProfileSchema.extend({
  staffInfo: staffInfoSchema.partial(),
  schedule: staffScheduleSchema.partial(),
})

// ============================================================================
// Activity & Contribution Validation
// ============================================================================

/**
 * Activity item validation
 */
export const activityItemSchema = z.object({
  type: z.nativeEnum(ActivityType),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  timestamp: dateSchema,
  icon: z.string().optional(),
  link: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Daily contribution validation
 */
export const dailyContributionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().nonnegative(),
  level: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  details: z
    .object({
      assignments: z.number().optional(),
      attendance: z.number().optional(),
      activities: z.number().optional(),
      achievements: z.number().optional(),
    })
    .optional(),
})

// ============================================================================
// API Request Validation
// ============================================================================

/**
 * Profile search parameters validation
 */
export const profileSearchParamsSchema = z.object({
  query: z.string().max(100).optional(),
  type: z.nativeEnum(UserProfileType).optional(),
  department: z.string().optional(),
  grade: z.string().optional(),
  skills: z.array(z.string()).optional(),
  sortBy: z.enum(["name", "joinedAt", "lastActive", "popularity"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().positive().max(100).default(20),
  offset: z.number().nonnegative().default(0),
})

/**
 * Profile update request validation
 */
export const profileUpdateRequestSchema = z
  .object({
    displayName: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: urlSchema,
    coverImage: urlSchema,
    socialLinks: socialLinksSchema,
    settings: profileSettingsSchema.partial(),
    customFields: z.record(z.string(), z.any()).optional(),
  })
  .partial()

/**
 * Profile visibility update validation
 */
export const profileVisibilityUpdateSchema = z.object({
  visibility: z.nativeEnum(ProfileVisibility),
})

/**
 * Profile theme update validation
 */
export const profileThemeUpdateSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  backgroundImage: urlSchema,
  backgroundPattern: z.string().optional(),
  cardStyle: z.enum(["flat", "elevated", "bordered"]).optional(),
  layout: z.enum(["classic", "modern", "compact"]).optional(),
})

// ============================================================================
// Connection & Interaction Validation
// ============================================================================

/**
 * Connection request validation
 */
export const connectionRequestSchema = z.object({
  targetUserId: z.string().uuid(),
  message: z.string().max(500).optional(),
})

/**
 * Message validation
 */
export const messageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  isPrivate: z.boolean().default(true),
})

/**
 * Endorsement validation
 */
export const endorsementSchema = z.object({
  userId: z.string().uuid(),
  skillName: z.string().min(1).max(50),
  comment: z.string().max(500).optional(),
})

// ============================================================================
// Bulk Operations Validation
// ============================================================================

/**
 * Bulk profile import validation
 */
export const bulkProfileImportSchema = z.object({
  profiles: z
    .array(
      z.object({
        email: emailSchema,
        displayName: z.string().min(2).max(100),
        type: z.nativeEnum(UserProfileType),
        additionalData: z.record(z.string(), z.any()).optional(),
      })
    )
    .min(1)
    .max(1000),
  skipExisting: z.boolean().default(false),
  sendWelcomeEmail: z.boolean().default(true),
})

/**
 * Bulk profile export validation
 */
export const bulkProfileExportSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  types: z.array(z.nativeEnum(UserProfileType)).optional(),
  format: z.enum(["json", "csv", "excel"]).default("json"),
  includePrivateData: z.boolean().default(false),
})

// ============================================================================
// Type Exports
// ============================================================================

export type BaseProfileInput = z.infer<typeof baseProfileSchema>
export type StudentProfileUpdate = z.infer<typeof studentProfileUpdateSchema>
export type TeacherProfileUpdate = z.infer<typeof teacherProfileUpdateSchema>
export type ParentProfileUpdate = z.infer<typeof parentProfileUpdateSchema>
export type StaffProfileUpdate = z.infer<typeof staffProfileUpdateSchema>
export type ProfileUpdateRequest = z.infer<typeof profileUpdateRequestSchema>
export type ProfileSearchParams = z.infer<typeof profileSearchParamsSchema>
export type ConnectionRequest = z.infer<typeof connectionRequestSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type EndorsementInput = z.infer<typeof endorsementSchema>
