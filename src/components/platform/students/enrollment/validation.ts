import { z } from "zod"

export const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  batchId: z.string().min(1, "Batch is required"),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),

  // Academic Details
  academicYearId: z.string().min(1, "Academic year is required"),
  termId: z.string().optional(),
  enrollmentDate: z.date(),
  expectedGraduationDate: z.date().optional(),

  // Enrollment Details
  enrollmentType: z.enum(["NEW", "TRANSFER", "READMISSION", "PROMOTION"]),
  previousSchoolId: z.string().optional(),
  previousBatchId: z.string().optional(),
  transferReason: z.string().max(500).optional(),

  // Course Selection
  mandatorySubjects: z
    .array(z.string())
    .min(1, "At least one mandatory subject is required"),
  electiveSubjects: z.array(z.string()).default([]),
  languagePreference: z.string().optional(),

  // Fee Structure
  feeStructureId: z.string().optional(),
  scholarshipId: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),

  // Additional Options
  transportRequired: z.boolean().default(false),
  hostelRequired: z.boolean().default(false),
  libraryAccess: z.boolean().default(true),
  labAccess: z.boolean().default(true),

  // Documents
  transferCertificate: z.boolean().optional(),
  previousMarksheets: z.boolean().optional(),
  migrationCertificate: z.boolean().optional(),

  notes: z.string().max(1000).optional(),
})

export const batchTransferSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  fromBatchId: z.string().min(1, "Current batch is required"),
  toBatchId: z.string().min(1, "New batch is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  effectiveDate: z.date(),
})

export const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(100),
  code: z.string().min(1, "Course code is required").max(20),
  description: z.string().max(500).optional(),
  yearLevelId: z.string().min(1, "Year level is required"),
  duration: z.number().min(1).max(48), // Max 4 years
})

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().min(1, "Subject code is required").max(20),
  type: z.enum(["MANDATORY", "ELECTIVE", "LANGUAGE", "VOCATIONAL"]),
  credits: z.number().min(0).max(10).optional(),
  weeklyHours: z.number().min(1).max(20),
  yearLevelId: z.string().min(1, "Year level is required"),
  prerequisites: z.array(z.string()).optional(),
})

export const sectionSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  name: z.string().min(1, "Section name is required").max(10),
  capacity: z.number().min(1).max(100),
  classTeacherId: z.string().optional(),
  roomId: z.string().optional(),
})

export type EnrollmentFormInput = z.infer<typeof enrollmentSchema>
export type BatchTransferFormInput = z.infer<typeof batchTransferSchema>
export type CourseFormInput = z.infer<typeof courseSchema>
export type SubjectFormInput = z.infer<typeof subjectSchema>
export type SectionFormInput = z.infer<typeof sectionSchema>
