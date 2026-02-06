// Public Admission Portal Types

import type {
  AdmissionApplicationStatus,
  BookingStatus,
  Gender,
  InquiryStatus,
  SlotType,
} from "@prisma/client"

// ============================================
// Application Form Types
// ============================================

export interface ApplicationFormData {
  // Step 1: Campaign Selection
  campaignId: string

  // Step 2: Personal Information
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  nationality: string
  religion?: string
  category?: string

  // Step 3: Contact Information
  email: string
  phone: string
  alternatePhone?: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string

  // Step 4: Guardian Information
  fatherName: string
  fatherOccupation?: string
  fatherPhone?: string
  fatherEmail?: string
  motherName: string
  motherOccupation?: string
  motherPhone?: string
  motherEmail?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string

  // Step 5: Academic Information
  previousSchool?: string
  previousClass?: string
  previousMarks?: string
  previousPercentage?: string
  achievements?: string
  applyingForClass: string
  preferredStream?: string
  secondLanguage?: string
  thirdLanguage?: string

  // Step 6: Documents
  photoUrl?: string
  signatureUrl?: string
  documents?: DocumentUpload[]
}

export interface DocumentUpload {
  type: string
  name: string
  url: string
  uploadedAt: string
}

export interface FormStep {
  id: string
  label: string
  description: string
  fields: (keyof ApplicationFormData)[]
}

export const FORM_STEPS: FormStep[] = [
  {
    id: "campaign",
    label: "اختر البرنامج",
    description: "اختر برنامج القبول الذي تتقدم إليه",
    fields: ["campaignId"],
  },
  {
    id: "personal",
    label: "المعلومات الشخصية",
    description: "المعلومات الشخصية للطالب",
    fields: [
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "gender",
      "nationality",
      "religion",
      "category",
    ],
  },
  {
    id: "contact",
    label: "معلومات الاتصال",
    description: "تفاصيل الاتصال والعنوان",
    fields: [
      "email",
      "phone",
      "alternatePhone",
      "address",
      "city",
      "state",
      "postalCode",
      "country",
    ],
  },
  {
    id: "guardian",
    label: "ولي الأمر",
    description: "معلومات الوالدين أو ولي الأمر",
    fields: [
      "fatherName",
      "fatherOccupation",
      "fatherPhone",
      "fatherEmail",
      "motherName",
      "motherOccupation",
      "motherPhone",
      "motherEmail",
      "guardianName",
      "guardianRelation",
      "guardianPhone",
      "guardianEmail",
    ],
  },
  {
    id: "academic",
    label: "التعليم",
    description: "التعليم السابق والصف المتقدم إليه",
    fields: [
      "previousSchool",
      "previousClass",
      "previousMarks",
      "achievements",
      "applyingForClass",
      "preferredStream",
      "secondLanguage",
      "thirdLanguage",
    ],
  },
  {
    id: "documents",
    label: "المستندات",
    description: "رفع المستندات المطلوبة",
    fields: ["photoUrl", "signatureUrl", "documents"],
  },
  {
    id: "review",
    label: "المراجعة",
    description: "مراجعة وتقديم طلبك",
    fields: [],
  },
]

// ============================================
// Session Types
// ============================================

export interface ApplicationSession {
  id: string
  sessionToken: string
  formData: Partial<ApplicationFormData>
  currentStep: number
  email: string
  expiresAt: Date
  campaignId?: string
}

// ============================================
// Campaign Types
// ============================================

export interface PublicCampaign {
  id: string
  name: string
  academicYear: string
  startDate: Date
  endDate: Date
  description?: string
  applicationFee?: number
  totalSeats: number
  availableSeats: number
  requiredDocuments?: RequiredDocument[]
  eligibilityCriteria?: EligibilityCriteria
}

export interface RequiredDocument {
  type: string
  name: string
  required: boolean
  description?: string
}

export interface EligibilityCriteria {
  minAge?: number
  maxAge?: number
  grades?: string[]
  description?: string
}

// ============================================
// Status Tracker Types
// ============================================

export interface ApplicationStatus {
  applicationNumber: string
  status: AdmissionApplicationStatus
  submittedAt?: Date
  currentStep: StatusStep
  timeline: StatusTimelineEntry[]
  checklist: ChecklistItem[]
  nextSteps?: string[]
}

export interface StatusStep {
  current: number
  total: number
  label: string
}

export interface StatusTimelineEntry {
  status: AdmissionApplicationStatus
  label: string
  date?: Date
  completed: boolean
  current: boolean
}

export interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  required: boolean
  type: "document" | "payment" | "interview" | "tour" | "other"
}

// ============================================
// Tour Booking Types
// ============================================

export interface TourSlot {
  id: string
  date: Date
  startTime: string
  endTime: string
  slotType: SlotType
  location?: string
  availableSpots: number
  maxCapacity: number
}

export interface TourBookingData {
  slotId: string
  parentName: string
  email: string
  phone?: string
  studentName?: string
  interestedGrade?: string
  specialRequests?: string
  numberOfAttendees: number
}

export interface TourBookingConfirmation {
  bookingNumber: string
  status: BookingStatus
  slot: TourSlot
  parentName: string
  email: string
  studentName?: string
  numberOfAttendees: number
}

// ============================================
// Inquiry Types
// ============================================

export interface InquiryFormData {
  parentName: string
  email: string
  phone?: string
  studentName?: string
  studentDOB?: string
  interestedGrade?: string
  source?: string
  message?: string
  subscribeNewsletter: boolean
}

export const INQUIRY_SOURCES = [
  { value: "website", label: "الموقع الإلكتروني" },
  { value: "social", label: "وسائل التواصل الاجتماعي" },
  { value: "referral", label: "صديق/عائلة" },
  { value: "advertisement", label: "إعلان" },
  { value: "event", label: "فعالية مدرسية" },
  { value: "other", label: "أخرى" },
] as const

// ============================================
// OTP Types
// ============================================

export interface OTPVerificationData {
  applicationNumber: string
  email: string
}

export interface OTPVerifyResult {
  success: boolean
  accessToken?: string
  error?: string
}

// ============================================
// Action Response Types
// ============================================

// Re-export shared ActionResponse as ActionResult for backward compatibility
export type { ActionResponse as ActionResult } from "@/lib/action-response"

export interface SubmitApplicationResult {
  applicationNumber: string
  status: AdmissionApplicationStatus
  accessToken: string
  requiresPayment: boolean
  paymentUrl?: string
}

// ============================================
// Grade Level Types
// ============================================

export interface GradeMapping {
  grade: string
  minAge: number
  maxAge: number
  description?: string
}

export const DEFAULT_GRADES: GradeMapping[] = [
  { grade: "روضة 1", minAge: 3, maxAge: 4 },
  { grade: "روضة 2", minAge: 4, maxAge: 5 },
  { grade: "الصف الأول", minAge: 5, maxAge: 6 },
  { grade: "الصف الثاني", minAge: 6, maxAge: 7 },
  { grade: "الصف الثالث", minAge: 7, maxAge: 8 },
  { grade: "الصف الرابع", minAge: 8, maxAge: 9 },
  { grade: "الصف الخامس", minAge: 9, maxAge: 10 },
  { grade: "الصف السادس", minAge: 10, maxAge: 11 },
  { grade: "الصف السابع", minAge: 11, maxAge: 12 },
  { grade: "الصف الثامن", minAge: 12, maxAge: 13 },
  { grade: "الصف التاسع", minAge: 13, maxAge: 14 },
  { grade: "الصف العاشر", minAge: 14, maxAge: 15 },
  { grade: "الصف الحادي عشر", minAge: 15, maxAge: 16 },
  { grade: "الصف الثاني عشر", minAge: 16, maxAge: 17 },
]

// Utility function to suggest grade based on date of birth
export function suggestGradeFromDOB(
  dob: Date,
  gradeMapping: GradeMapping[] = DEFAULT_GRADES,
  referenceDate: Date = new Date()
): GradeMapping | null {
  const age = Math.floor(
    (referenceDate.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  for (const mapping of gradeMapping) {
    if (age >= mapping.minAge && age <= mapping.maxAge) {
      return mapping
    }
  }
  return null
}
