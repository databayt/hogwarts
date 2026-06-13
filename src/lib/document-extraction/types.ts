// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Document Extraction Types
 * Type definitions for AI-powered document extraction
 */

export type OnboardingStep =
  | "title"
  | "description"
  | "location"
  | "capacity"
  | "branding"
  | "import"
  | "price"
  | "legal"

export interface ExtractedField {
  key: string
  value: unknown
  confidence: "high" | "medium" | "low"
  source?: string
  originalText?: string
}

export interface ExtractedData {
  fields: ExtractedField[]
  rawText?: string
  documentType?: string
  confidence: number
}

export interface ExtractionResult {
  success: boolean
  data?: ExtractedData
  error?: string
  processingTime: number
}

export interface ExtractionOptions {
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
}

// Generic extraction options for domain-agnostic extraction
export interface GenericExtractionOptions extends ExtractionOptions {
  schema: import("zod").ZodType
  prompt: string
  systemPrompt?: string
  preferVision?: boolean // Use image input even for text-extractable docs (default: false for text docs)
}

// Processing job types for the document processing queue
export type ProcessingJobType =
  | "admission_document"
  | "admission_classify"
  | "bank_receipt"
  | "textbook_metadata"
  | "textbook_chapters"
  | "textbook_embedding"
  | "book_metadata"
  | "vendor_invoice"
  | "expense_receipt"
  | "answer_sheet_ocr"
  | "onboarding"
  | "generic"

// Generic extraction result with typed data
export interface GenericExtractionResult<T = unknown> {
  success: boolean
  data?: {
    fields: ExtractedField[]
    rawText?: string
    documentType?: string
    confidence: number
    extractedObject: T
  }
  error?: string
  errorCode?: string
  processingTime: number
  /** Token counts returned by the SDK — used for usage tracking */
  inputTokens?: number
  outputTokens?: number
}

// Step-specific extracted data types
export interface TitleData {
  schoolName?: string
  subdomain?: string
  tagline?: string
}

export interface DescriptionData {
  mission?: string
  vision?: string
  values?: string[]
  description?: string
}

export interface LocationData {
  country?: string
  state?: string
  city?: string
  address?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
}

export interface CapacityData {
  totalStudents?: number
  totalTeachers?: number
  totalClasses?: number
  maxClassSize?: number
  facilities?: string[]
}

export interface PriceData {
  currency?: string
  tuitionFee?: number
  registrationFee?: number
  otherFees?: Array<{
    name: string
    amount: number
    frequency?: string
  }>
}
