// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Extraction Schemas
 * Zod schemas for validating AI-extracted data from admission documents
 */

import { z } from "zod"

// ============================================
// DOCUMENT CLASSIFICATION
// ============================================

export const documentClassificationSchema = z.object({
  type: z
    .enum(["degree", "transcript", "national_id", "resume", "other"])
    .describe(
      "The type of document: degree certificate, academic transcript, national ID card, resume/CV, or other"
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Confidence score between 0 and 1 for the classification"),
  reasoning: z
    .string()
    .optional()
    .describe("Brief explanation of why this document type was chosen"),
})

// ============================================
// DEGREE / CERTIFICATE
// ============================================

export const degreeExtractionSchema = z.object({
  institution: z
    .string()
    .optional()
    .describe("Name of the educational institution that issued the degree"),
  degree: z
    .string()
    .optional()
    .describe("Degree title (e.g., Bachelor of Science, Master of Arts, PhD)"),
  fieldOfStudy: z
    .string()
    .optional()
    .describe("Major or field of study (e.g., Computer Science, Medicine)"),
  graduationYear: z
    .number()
    .int()
    .optional()
    .describe("Year of graduation or degree conferral"),
  gpa: z
    .number()
    .optional()
    .describe("Grade point average if mentioned on the certificate"),
  gpaScale: z.number().optional().describe("GPA scale (e.g., 4.0, 5.0, 100)"),
  honors: z
    .string()
    .optional()
    .describe(
      "Honors or distinction (e.g., Summa Cum Laude, First Class, Distinction)"
    ),
  country: z
    .string()
    .optional()
    .describe("Country where the institution is located"),
})

// ============================================
// TRANSCRIPT
// ============================================

export const transcriptCourseSchema = z.object({
  name: z.string().optional().describe("Course name or title"),
  grade: z
    .string()
    .optional()
    .describe("Grade received (e.g., A, B+, 85%, Pass)"),
  credits: z.number().optional().describe("Credit hours for this course"),
  semester: z
    .string()
    .optional()
    .describe("Semester or term (e.g., Fall 2023, First Semester)"),
})

export const transcriptExtractionSchema = z.object({
  institution: z
    .string()
    .optional()
    .describe("Name of the educational institution"),
  studentName: z
    .string()
    .optional()
    .describe("Full name of the student as it appears on the transcript"),
  studentId: z.string().optional().describe("Student identification number"),
  courses: z
    .array(transcriptCourseSchema)
    .optional()
    .describe("List of courses with grades and credits"),
  cumulativeGpa: z
    .number()
    .optional()
    .describe("Cumulative GPA across all semesters"),
  gpaScale: z.number().optional().describe("GPA scale (e.g., 4.0, 5.0, 100)"),
  totalCredits: z.number().optional().describe("Total credit hours completed"),
  academicYear: z
    .string()
    .optional()
    .describe("Academic year or period covered by this transcript"),
})

// ============================================
// NATIONAL ID
// ============================================

export const nationalIdExtractionSchema = z.object({
  fullName: z
    .string()
    .optional()
    .describe(
      "Full name as it appears on the ID document. If in Arabic, transliterate to Latin script"
    ),
  dateOfBirth: z
    .string()
    .optional()
    .describe("Date of birth in YYYY-MM-DD format"),
  idNumber: z.string().optional().describe("National identification number"),
  nationality: z.string().optional().describe("Nationality or citizenship"),
  gender: z
    .string()
    .optional()
    .describe("Gender as stated on the document (Male/Female)"),
  expiryDate: z
    .string()
    .optional()
    .describe("ID expiry date in YYYY-MM-DD format"),
  issueDate: z
    .string()
    .optional()
    .describe("ID issue date in YYYY-MM-DD format"),
  placeOfBirth: z
    .string()
    .optional()
    .describe("Place of birth as stated on the document"),
})

// ============================================
// RESUME / CV
// ============================================

export const resumeEducationSchema = z.object({
  institution: z
    .string()
    .optional()
    .describe("Name of the educational institution"),
  degree: z.string().optional().describe("Degree or qualification obtained"),
  fieldOfStudy: z.string().optional().describe("Field of study or major"),
  year: z
    .number()
    .int()
    .optional()
    .describe("Year of completion or graduation"),
})

export const resumeExperienceSchema = z.object({
  company: z.string().optional().describe("Company or organization name"),
  role: z.string().optional().describe("Job title or role"),
  years: z.number().optional().describe("Number of years in this position"),
  description: z
    .string()
    .optional()
    .describe("Brief description of responsibilities"),
})

export const resumeExtractionSchema = z.object({
  fullName: z
    .string()
    .optional()
    .describe("Full name of the person from the resume"),
  email: z.string().email().optional().describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  education: z
    .array(resumeEducationSchema)
    .optional()
    .describe("Educational background entries"),
  experience: z
    .array(resumeExperienceSchema)
    .optional()
    .describe("Work experience entries"),
  skills: z.array(z.string()).optional().describe("List of skills"),
  languages: z
    .array(z.string())
    .optional()
    .describe("Languages spoken or written"),
})

// ============================================
// SCHEMA MAP
// ============================================

export const admissionDocumentSchemaMap = {
  degree: degreeExtractionSchema,
  transcript: transcriptExtractionSchema,
  national_id: nationalIdExtractionSchema,
  resume: resumeExtractionSchema,
  other: z.object({}),
} as const

export type AdmissionDocumentSchemaMap = typeof admissionDocumentSchemaMap
export type SchemaForDocumentType<T extends keyof AdmissionDocumentSchemaMap> =
  z.infer<AdmissionDocumentSchemaMap[T]>
