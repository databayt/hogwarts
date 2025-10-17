import type { Student, Batch, StudentBatch } from "../registration/types";

export interface EnrollmentFormData {
  studentId: string;
  batchId: string;
  courseId?: string;
  sectionId?: string;

  // Academic Details
  academicYearId: string;
  termId?: string;
  enrollmentDate: Date;
  expectedGraduationDate?: Date;

  // Enrollment Details
  enrollmentType: "NEW" | "TRANSFER" | "READMISSION" | "PROMOTION";
  previousSchoolId?: string;
  previousBatchId?: string;
  transferReason?: string;

  // Course Selection
  mandatorySubjects: string[];
  electiveSubjects: string[];
  languagePreference?: string;

  // Fee Structure
  feeStructureId?: string;
  scholarshipId?: string;
  discountPercentage?: number;

  // Additional Options
  transportRequired: boolean;
  hostelRequired: boolean;
  libraryAccess: boolean;
  labAccess: boolean;

  // Documents
  transferCertificate?: boolean;
  previousMarksheets?: boolean;
  migrationCertificate?: boolean;

  notes?: string;
}

export interface Course {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  yearLevelId: string;
  duration: number; // in months
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: "MANDATORY" | "ELECTIVE" | "LANGUAGE" | "VOCATIONAL";
  credits?: number;
  weeklyHours: number;
  yearLevelId: string;
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  schoolId: string;
  batchId: string;
  name: string;
  capacity: number;
  currentStrength: number;
  classTeacherId?: string;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentStatus {
  id: string;
  studentId: string;
  batchId: string;
  status: "ENROLLED" | "WITHDRAWN" | "COMPLETED" | "TRANSFERRED" | "SUSPENDED";
  effectiveDate: Date;
  reason?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchTransferRequest {
  id: string;
  studentId: string;
  fromBatchId: string;
  toBatchId: string;
  requestDate: Date;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvalDate?: Date;
  rejectionReason?: string;
  effectiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentSummary {
  totalStudents: number;
  newEnrollments: number;
  transfers: number;
  withdrawals: number;
  batchWise: {
    batchId: string;
    batchName: string;
    enrolled: number;
    capacity: number;
    occupancy: number; // percentage
  }[];
  courseWise: {
    courseId: string;
    courseName: string;
    enrolled: number;
  }[];
}