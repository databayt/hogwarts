/**
 * Unified File Block - Generate Types
 * Type definitions for document generation
 */

// ============================================================================
// Document Types
// ============================================================================

export type GenerateDocumentType =
  | "invoice"
  | "receipt"
  | "certificate"
  | "report_card"
  | "id_card"
  | "transcript"

export type TemplateStyle =
  | "classic"
  | "modern"
  | "minimal"
  | "elegant"
  | "achievement"
  | "compact"
  | "detailed"
  | "standard"
  | "official"
  | "summary"
  | "photo-id"

// ============================================================================
// Common Document Data
// ============================================================================

export interface DocumentMetadata {
  /** School information */
  schoolName: string
  schoolNameAr?: string
  schoolLogo?: string
  schoolAddress?: string
  schoolPhone?: string
  schoolEmail?: string
  schoolWebsite?: string

  /** Document info */
  documentNumber?: string
  issueDate: Date
  validUntil?: Date

  /** Locale */
  locale?: "en" | "ar"
}

// ============================================================================
// Invoice Data
// ============================================================================

export interface InvoiceItem {
  description: string
  descriptionAr?: string
  quantity: number
  unitPrice: number
  total: number
  taxRate?: number
}

export interface InvoiceData extends DocumentMetadata {
  /** Invoice specific */
  invoiceNumber: string
  dueDate: Date
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled"

  /** Client info */
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string

  /** Student info (for school invoices) */
  studentName?: string
  studentId?: string
  className?: string
  yearLevel?: string

  /** Line items */
  items: InvoiceItem[]

  /** Totals */
  subtotal: number
  taxAmount?: number
  discount?: number
  total: number
  amountPaid?: number
  balance?: number

  /** Payment info */
  paymentTerms?: string
  bankDetails?: string
  notes?: string

  /** Currency */
  currency: string
}

// ============================================================================
// Receipt Data
// ============================================================================

export interface ReceiptData extends DocumentMetadata {
  /** Receipt specific */
  receiptNumber: string
  paymentDate: Date
  paymentMethod: "cash" | "card" | "bank_transfer" | "cheque" | "online"

  /** Payer info */
  payerName: string
  payerEmail?: string

  /** Student info */
  studentName?: string
  studentId?: string

  /** Payment details */
  items: Array<{
    description: string
    amount: number
  }>
  total: number
  currency: string

  /** Reference */
  invoiceNumber?: string
  transactionId?: string

  /** Notes */
  notes?: string
}

// ============================================================================
// Certificate Data
// ============================================================================

export interface CertificateData extends DocumentMetadata {
  /** Certificate type */
  certificateType:
    | "completion"
    | "achievement"
    | "participation"
    | "honor"
    | "custom"
  certificateTitle: string
  certificateTitleAr?: string

  /** Recipient */
  recipientName: string
  recipientNameAr?: string

  /** Details */
  achievement: string
  achievementAr?: string
  courseName?: string
  courseNameAr?: string
  grade?: string
  score?: number

  /** Dates */
  completionDate?: Date
  expiryDate?: Date

  /** Signatures */
  signatures: Array<{
    name: string
    title: string
    signature?: string // Base64 image
  }>

  /** Certificate number */
  certificateNumber: string

  /** QR code data for verification */
  verificationUrl?: string
}

// ============================================================================
// Report Card Data
// ============================================================================

export interface ReportCardSubject {
  name: string
  nameAr?: string
  grade: string
  score?: number
  maxScore?: number
  percentage?: number
  teacherName?: string
  comments?: string
  commentsAr?: string
}

export interface ReportCardData extends DocumentMetadata {
  /** Student info */
  studentName: string
  studentNameAr?: string
  studentId: string
  studentPhoto?: string

  /** Class info */
  className: string
  classNameAr?: string
  yearLevel: string
  section?: string

  /** Term info */
  termName: string
  termNameAr?: string
  academicYear: string

  /** Grades */
  subjects: ReportCardSubject[]

  /** Summary */
  overallGrade?: string
  overallPercentage?: number
  rank?: number
  totalStudents?: number
  gpa?: number

  /** Attendance */
  totalDays?: number
  presentDays?: number
  absentDays?: number
  lateDays?: number
  attendancePercentage?: number

  /** Comments */
  teacherComments?: string
  teacherCommentsAr?: string
  principalComments?: string
  principalCommentsAr?: string

  /** Signatures */
  classTeacherSignature?: string
  principalSignature?: string
  parentSignature?: string

  /** Next term dates */
  nextTermStart?: Date
}

// ============================================================================
// ID Card Data
// ============================================================================

export interface IdCardData extends DocumentMetadata {
  /** Card type */
  cardType: "student" | "teacher" | "staff" | "parent"

  /** Personal info */
  fullName: string
  fullNameAr?: string
  photo: string // URL or base64
  idNumber: string

  /** Role-specific */
  className?: string // For students
  department?: string // For teachers/staff
  designation?: string // For staff
  childNames?: string[] // For parents

  /** Contact */
  emergencyContact?: string
  bloodGroup?: string
  address?: string

  /** Barcode/QR */
  barcodeData: string
  qrCodeData?: string
}

// ============================================================================
// Transcript Data
// ============================================================================

export interface TranscriptCourse {
  code: string
  name: string
  nameAr?: string
  credits?: number
  grade: string
  gradePoints?: number
  term: string
  year: string
}

export interface TranscriptData extends DocumentMetadata {
  /** Student info */
  studentName: string
  studentNameAr?: string
  studentId: string
  dateOfBirth?: Date
  enrollmentDate: Date
  graduationDate?: Date

  /** Program info */
  programName: string
  programNameAr?: string
  major?: string
  minor?: string

  /** Academic records */
  courses: TranscriptCourse[]

  /** Summary */
  totalCredits?: number
  earnedCredits?: number
  cumulativeGpa?: number
  standing?: string // Good standing, probation, etc.

  /** Graduation */
  degreeAwarded?: string
  honors?: string

  /** Official use */
  issuedTo?: string
  purpose?: string
  registrarSignature?: string
  registrarName?: string
  seal?: string // Base64 image of official seal
}

// ============================================================================
// Generate Configuration
// ============================================================================

export interface GenerateConfig<T = unknown> {
  /** Document type */
  type: GenerateDocumentType

  /** Template style */
  style?: TemplateStyle

  /** Document data */
  data: T

  /** Output options */
  output?: "pdf" | "html" | "print"

  /** Filename (without extension) */
  filename?: string

  /** Quality */
  quality?: "draft" | "standard" | "high"
}

// ============================================================================
// Generate Result
// ============================================================================

export interface GenerateResult {
  success: boolean
  filename?: string
  url?: string
  blob?: Blob
  html?: string
  error?: string
}

// ============================================================================
// Generate Progress
// ============================================================================

export interface GenerateProgress {
  status: "idle" | "generating" | "completed" | "error"
  progress: number
  message?: string
  error?: string
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseGenerateReturn {
  /** State */
  isGenerating: boolean
  progress: GenerateProgress
  error: string | null

  /** Actions */
  generateInvoice: (
    data: InvoiceData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>
  generateReceipt: (
    data: ReceiptData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>
  generateCertificate: (
    data: CertificateData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>
  generateReportCard: (
    data: ReportCardData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>
  generateIdCard: (
    data: IdCardData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>
  generateTranscript: (
    data: TranscriptData,
    style?: TemplateStyle
  ) => Promise<GenerateResult>

  /** Generic generate */
  generate: <T>(config: GenerateConfig<T>) => Promise<GenerateResult>

  /** Reset */
  reset: () => void
}
