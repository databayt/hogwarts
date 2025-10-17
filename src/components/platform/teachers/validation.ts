import { z } from "zod"

// Base teacher information schema
export const teacherBaseSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  gender: z.enum(["male", "female"]).optional(),
  emailAddress: z.string().email("Valid email is required"),
  birthDate: z.coerce.date().optional(),
})

// Employment details schema
export const employmentDetailsSchema = z.object({
  employeeId: z.string().optional(),
  joiningDate: z.coerce.date().optional(),
  employmentStatus: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RETIRED"]).default("ACTIVE"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "SUBSTITUTE"]).default("FULL_TIME"),
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If contract dates are provided, start must be before end
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

// Qualification schema
export const qualificationSchema = z.object({
  qualificationType: z.enum(["DEGREE", "CERTIFICATION", "LICENSE"]),
  name: z.string().min(1, "Qualification name is required"),
  institution: z.string().optional(),
  major: z.string().optional(),
  dateObtained: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  licenseNumber: z.string().optional(),
  documentUrl: z.string().optional(),
}).refine(
  (data) => {
    // If expiry date is provided, it must be after obtained date
    if (data.expiryDate && data.dateObtained) {
      return data.dateObtained < data.expiryDate
    }
    return true
  },
  {
    message: "Expiry date must be after date obtained",
    path: ["expiryDate"],
  }
)

// Experience schema
export const experienceSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
}).refine(
  (data) => {
    // If not current and end date is provided, start must be before end
    if (!data.isCurrent && data.endDate) {
      return data.startDate < data.endDate
    }
    return true
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
)

// Phone number schema
export const phoneNumberSchema = z.object({
  phoneType: z.enum(["mobile", "home", "work", "emergency"]),
  phoneNumber: z.string().min(1, "Phone number is required"),
  isPrimary: z.boolean().default(false),
})

// Subject expertise schema
export const subjectExpertiseSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  expertiseLevel: z.enum(["PRIMARY", "SECONDARY", "CERTIFIED"]),
})

// Complete teacher creation schema with all nested data
export const teacherCreateSchema = teacherBaseSchema
  .merge(employmentDetailsSchema)
  .extend({
    phoneNumbers: z.array(phoneNumberSchema).optional().default([]),
    qualifications: z.array(qualificationSchema).optional().default([]),
    experiences: z.array(experienceSchema).optional().default([]),
    subjectExpertise: z.array(subjectExpertiseSchema).optional().default([]),
  })
  .refine(
    (data) => {
      // Birth date must be before joining date
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

export const teacherUpdateSchema = teacherBaseSchema
  .merge(employmentDetailsSchema)
  .partial()
  .extend({
    id: z.string().min(1, "Required"),
    qualifications: z.array(qualificationSchema).optional(),
    experiences: z.array(experienceSchema).optional(),
    subjectExpertise: z.array(subjectExpertiseSchema).optional(),
  })

// Class teacher assignment schema (for co-teaching)
export const classTeacherSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  role: z.enum(["PRIMARY", "CO_TEACHER", "ASSISTANT"]).default("PRIMARY"),
})

// Workload configuration schema
export const workloadConfigSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  minPeriodsPerWeek: z.number().int().min(1).max(50).default(15),
  normalPeriodsPerWeek: z.number().int().min(1).max(50).default(20),
  maxPeriodsPerWeek: z.number().int().min(1).max(50).default(25),
  overloadThreshold: z.number().int().min(1).max(50).default(25),
}).refine(
  (data) => {
    return data.minPeriodsPerWeek <= data.normalPeriodsPerWeek &&
           data.normalPeriodsPerWeek <= data.maxPeriodsPerWeek &&
           data.maxPeriodsPerWeek <= data.overloadThreshold
  },
  {
    message: "Thresholds must be in ascending order: min ≤ normal ≤ max ≤ overload",
    path: ["overloadThreshold"],
  }
)

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

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
