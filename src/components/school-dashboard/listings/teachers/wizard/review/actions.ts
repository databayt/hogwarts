"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface TeacherReviewData {
  id: string
  givenName: string
  surname: string
  gender: string | null
  birthDate: Date | null
  emailAddress: string
  employeeId: string | null
  joiningDate: Date | null
  employmentStatus: string
  employmentType: string
  contractStartDate: Date | null
  contractEndDate: Date | null
  phoneNumbers: {
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }[]
  qualifications: {
    id: string
    qualificationType: string
    name: string
    institution: string | null
    major: string | null
    dateObtained: Date
    expiryDate: Date | null
    licenseNumber: string | null
  }[]
  experiences: {
    id: string
    institution: string
    position: string
    startDate: Date
    endDate: Date | null
    isCurrent: boolean
    description: string | null
  }[]
  subjectExpertise: {
    id: string
    subjectId: string
    expertiseLevel: string
    subject: { id: string; subjectName: string }
  }[]
}

export async function getTeacherReview(
  teacherId: string
): Promise<ActionResponse<TeacherReviewData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      include: {
        phoneNumbers: {
          where: { schoolId },
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
            isPrimary: true,
          },
        },
        qualifications: {
          where: { schoolId },
          select: {
            id: true,
            qualificationType: true,
            name: true,
            institution: true,
            major: true,
            dateObtained: true,
            expiryDate: true,
            licenseNumber: true,
          },
        },
        experiences: {
          where: { schoolId },
          select: {
            id: true,
            institution: true,
            position: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
        },
        subjectExpertise: {
          where: { schoolId },
          select: {
            id: true,
            subjectId: true,
            expertiseLevel: true,
            subject: { select: { id: true, subjectName: true } },
          },
        },
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return { success: true, data: teacher as TeacherReviewData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}
