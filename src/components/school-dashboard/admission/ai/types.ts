// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document AI Types
 * Type definitions for AI-powered admission document processing
 */

// ============================================
// DOCUMENT CLASSIFICATION
// ============================================

export type AdmissionDocumentType =
  | "degree"
  | "transcript"
  | "national_id"
  | "resume"
  | "other"

export interface DocumentClassification {
  type: AdmissionDocumentType
  confidence: number
  reasoning?: string
}

// ============================================
// PER-DOCUMENT EXTRACTED DATA SHAPES
// ============================================

export interface DegreeData {
  institution?: string
  degree?: string
  fieldOfStudy?: string
  graduationYear?: number
  gpa?: number
  gpaScale?: number
  honors?: string
  country?: string
}

export interface TranscriptCourse {
  name?: string
  grade?: string
  credits?: number
  semester?: string
}

export interface TranscriptData {
  institution?: string
  studentName?: string
  studentId?: string
  courses?: TranscriptCourse[]
  cumulativeGpa?: number
  gpaScale?: number
  totalCredits?: number
  academicYear?: string
}

export interface NationalIdData {
  fullName?: string
  dateOfBirth?: string
  idNumber?: string
  nationality?: string
  gender?: string
  expiryDate?: string
  issueDate?: string
  placeOfBirth?: string
}

export interface ResumeEducation {
  institution?: string
  degree?: string
  fieldOfStudy?: string
  year?: number
}

export interface ResumeExperience {
  company?: string
  role?: string
  years?: number
  description?: string
}

export interface ResumeData {
  fullName?: string
  email?: string
  phone?: string
  education?: ResumeEducation[]
  experience?: ResumeExperience[]
  skills?: string[]
  languages?: string[]
}

export type ExtractedDocumentData =
  | DegreeData
  | TranscriptData
  | NationalIdData
  | ResumeData
  | Record<string, unknown>

// ============================================
// PROCESSED DOCUMENT
// ============================================

export type DocumentProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"

export interface ProcessedDocument {
  type: AdmissionDocumentType
  url: string
  fileName: string
  extractedData?: ExtractedDocumentData
  confidence?: number
  processedAt?: string
  status: DocumentProcessingStatus
  jobId?: string
  error?: string
}

// ============================================
// COMPLETENESS CHECK
// ============================================

export interface CompletenessResult {
  complete: boolean
  present: AdmissionDocumentType[]
  missing: AdmissionDocumentType[]
  needsVerification: AdmissionDocumentType[]
  summary?: string
}

// ============================================
// MERIT SCORING
// ============================================

export interface MeritScoreBreakdown {
  academicScore: number
  entranceScore: number
  interviewScore: number
  academicWeight: number
  entranceWeight: number
  interviewWeight: number
  totalScore: number
  normalizedAcademic: number
  normalizedEntrance: number
  normalizedInterview: number
}
