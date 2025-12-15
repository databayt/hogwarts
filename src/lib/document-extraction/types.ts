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
