import { z } from "zod";

// Campaign validation schema
export const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Campaign name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "PROCESSING", "COMPLETED"]).default("DRAFT"),
  description: z.string().optional(),
  eligibilityCriteria: z.array(z.string()).optional(),
  requiredDocuments: z.array(z.string()).default([
    "Birth Certificate",
    "Previous School Transfer Certificate",
    "Previous Year Marksheet",
    "Address Proof",
    "Passport Size Photo",
  ]),
  applicationFee: z.number().min(0).optional(),
  totalSeats: z.number().min(1, "Total seats must be at least 1"),
  reservedSeats: z.array(z.object({
    category: z.string(),
    percentage: z.number().min(0).max(100),
    seats: z.number().min(0),
  })).optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Application validation schema
export const applicationSchema = z.object({
  id: z.string().optional(),
  campaignId: z.string().min(1, "Campaign is required"),

  // Applicant Details
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  nationality: z.string().default("Indian"),
  religion: z.string().optional(),
  category: z.string().optional(),

  // Contact Information
  email: z.string().email("Valid email is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  alternatePhone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^[0-9]{6}$/, "Postal code must be 6 digits"),
  country: z.string().default("India"),

  // Parent/Guardian Details
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().optional(),
  fatherPhone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  fatherEmail: z.string().email("Valid email required").optional(),
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().optional(),
  motherPhone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  motherEmail: z.string().email("Valid email required").optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  guardianEmail: z.string().email("Valid email required").optional(),

  // Academic Details
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  previousMarks: z.number().min(0).max(100).optional(),
  previousPercentage: z.number().min(0).max(100).optional(),
  achievements: z.string().optional(),

  // Application Details
  applyingForClass: z.string().min(1, "Class is required"),
  preferredStream: z.string().optional(),
  secondLanguage: z.string().optional(),
  thirdLanguage: z.string().optional(),

  // Documents
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number().optional(),
    uploadedAt: z.date(),
  })).optional(),
  photoUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),

  // Status
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "ENTRANCE_SCHEDULED",
    "INTERVIEW_SCHEDULED",
    "SELECTED",
    "WAITLISTED",
    "REJECTED",
    "ADMITTED",
    "WITHDRAWN",
  ]).default("DRAFT"),

  // Payment
  applicationFeePaid: z.boolean().default(false),
  paymentId: z.string().optional(),
  paymentDate: z.date().optional(),
});

// Filter schema for applications
export const applicationFilterSchema = z.object({
  campaignId: z.string().optional(),
  status: z.string().optional(),
  class: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
});

// Merit list generation schema
export const meritListSchema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  criteria: z.object({
    academicWeight: z.number().min(0).max(100).default(40),
    entranceWeight: z.number().min(0).max(100).default(30),
    interviewWeight: z.number().min(0).max(100).default(20),
    extracurricularWeight: z.number().min(0).max(100).default(10),
  }),
  cutoffScore: z.number().min(0).max(100).optional(),
  reservationPolicy: z.boolean().default(true),
});

// Bulk action schema
export const bulkActionSchema = z.object({
  applicationIds: z.array(z.string()).min(1, "Select at least one application"),
  action: z.enum([
    "SHORTLIST",
    "SCHEDULE_ENTRANCE",
    "SCHEDULE_INTERVIEW",
    "SELECT",
    "WAITLIST",
    "REJECT",
    "SEND_EMAIL",
    "SEND_SMS",
  ]),
  data: z.record(z.any()).optional(),
});

// Communication schema
export const communicationSchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  type: z.enum(["EMAIL", "SMS", "LETTER", "NOTIFICATION"]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  attachments: z.array(z.string()).optional(),
});

// Entrance exam schema
export const entranceExamSchema = z.object({
  campaignId: z.string().min(1, "Campaign is required"),
  examDate: z.date(),
  examTime: z.string(),
  venue: z.string().min(1, "Venue is required"),
  duration: z.number().min(30, "Minimum duration is 30 minutes"),
  maxMarks: z.number().min(1, "Maximum marks required"),
  instructions: z.string().optional(),
});

// Interview schedule schema
export const interviewScheduleSchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  interviewDate: z.date(),
  interviewTime: z.string(),
  venue: z.string().min(1, "Venue is required"),
  panel: z.array(z.string()).min(1, "At least one panel member required"),
  duration: z.number().min(15, "Minimum duration is 15 minutes"),
  instructions: z.string().optional(),
});

// Export types
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type ApplicationFormData = z.infer<typeof applicationSchema>;
export type MeritListFormData = z.infer<typeof meritListSchema>;
export type BulkActionFormData = z.infer<typeof bulkActionSchema>;
export type CommunicationFormData = z.infer<typeof communicationSchema>;
export type EntranceExamFormData = z.infer<typeof entranceExamSchema>;
export type InterviewScheduleFormData = z.infer<typeof interviewScheduleSchema>;