import { z } from "zod";
import {
  campaignSchema,
  applicationSchema,
  applicationFilterSchema,
  meritListSchema,
  communicationSchema
} from "./validation";

// Infer types from Zod schemas
export type Campaign = z.infer<typeof campaignSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationFilter = z.infer<typeof applicationFilterSchema>;
export type MeritList = z.infer<typeof meritListSchema>;
export type Communication = z.infer<typeof communicationSchema>;

// Enums matching Prisma schema
export const AdmissionStatus = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
} as const;

export const ApplicationStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  SHORTLISTED: "SHORTLISTED",
  ENTRANCE_SCHEDULED: "ENTRANCE_SCHEDULED",
  INTERVIEW_SCHEDULED: "INTERVIEW_SCHEDULED",
  SELECTED: "SELECTED",
  WAITLISTED: "WAITLISTED",
  REJECTED: "REJECTED",
  ADMITTED: "ADMITTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const CommunicationType = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  LETTER: "LETTER",
  NOTIFICATION: "NOTIFICATION",
} as const;

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

export type AdmissionStatus = keyof typeof AdmissionStatus;
export type ApplicationStatus = keyof typeof ApplicationStatus;
export type CommunicationType = keyof typeof CommunicationType;
export type Gender = keyof typeof Gender;

// Document types
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploadedAt: Date;
}

// Merit calculation config
export interface MeritConfig {
  academicWeight: number;
  entranceWeight: number;
  interviewWeight: number;
  extracurricularWeight: number;
}

// Seat allocation config
export interface SeatAllocation {
  category: string;
  percentage: number;
  seats: number;
}

// Dashboard stats
export interface AdmissionStats {
  totalApplications: number;
  submitted: number;
  underReview: number;
  selected: number;
  waitlisted: number;
  rejected: number;
  admitted: number;
  seatsFilled: number;
  seatsAvailable: number;
}