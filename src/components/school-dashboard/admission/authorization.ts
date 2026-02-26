// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Authorization for Admission module
 * Implements RBAC for admission operations
 *
 * Permission Rules:
 * - DEVELOPER: Full access to all admission operations across all schools
 * - ADMIN: Full access within their school
 * - STAFF: Can review applications, update status, and place students
 * - ACCOUNTANT: Can view applications and record payments
 * - TEACHER, STUDENT, GUARDIAN, USER: No admission access
 */

import type { UserRole } from "@prisma/client"

type AdmissionAction =
  | "manageCampaigns"
  | "reviewApplications"
  | "updateStatus"
  | "confirmEnrollment"
  | "recordPayment"
  | "placeStudents"
  | "generateMeritList"
  | "viewApplications"

const ADMISSION_PERMISSIONS: Record<AdmissionAction, UserRole[]> = {
  manageCampaigns: ["DEVELOPER", "ADMIN"],
  reviewApplications: ["DEVELOPER", "ADMIN", "STAFF"],
  updateStatus: ["DEVELOPER", "ADMIN", "STAFF"],
  confirmEnrollment: ["DEVELOPER", "ADMIN"],
  recordPayment: ["DEVELOPER", "ADMIN", "ACCOUNTANT"],
  placeStudents: ["DEVELOPER", "ADMIN", "STAFF"],
  generateMeritList: ["DEVELOPER", "ADMIN"],
  viewApplications: ["DEVELOPER", "ADMIN", "STAFF", "ACCOUNTANT"],
}

export function canPerformAdmissionAction(
  role: string,
  action: AdmissionAction
): boolean {
  const allowedRoles = ADMISSION_PERMISSIONS[action]
  return allowedRoles.includes(role as UserRole)
}

export function assertAdmissionPermission(
  role: string,
  action: AdmissionAction
): void {
  if (!canPerformAdmissionAction(role, action)) {
    throw new Error(
      `Permission denied: ${action} requires role ${ADMISSION_PERMISSIONS[action].join(", ")}`
    )
  }
}
