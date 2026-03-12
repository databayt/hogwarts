"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contactSchema, type ContactFormData } from "./validation"

export async function getTeacherContact(
  teacherId: string
): Promise<ActionResponse<ContactFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        emailAddress: true,
        phoneNumbers: {
          where: { schoolId },
          select: { phoneType: true, phoneNumber: true, isPrimary: true },
        },
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return {
      success: true,
      data: {
        emailAddress: teacher.emailAddress.endsWith("@draft.internal")
          ? ""
          : teacher.emailAddress,
        phoneNumbers: teacher.phoneNumbers.map((p) => ({
          phoneType: p.phoneType as "mobile" | "home" | "work" | "emergency",
          phoneNumber: p.phoneNumber,
          isPrimary: p.isPrimary,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherContact(
  teacherId: string,
  input: ContactFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = contactSchema.parse(input)

    // Check email uniqueness within school
    const existing = await db.teacher.findFirst({
      where: {
        schoolId,
        emailAddress: parsed.emailAddress,
        id: { not: teacherId },
      },
    })
    if (existing) {
      return {
        success: false,
        error: "Email already in use by another teacher",
      }
    }

    await db.$transaction([
      // Update email
      db.teacher.updateMany({
        where: { id: teacherId, schoolId },
        data: { emailAddress: parsed.emailAddress },
      }),
      // Delete + recreate phone numbers
      db.teacherPhoneNumber.deleteMany({
        where: { teacherId, schoolId },
      }),
      ...(parsed.phoneNumbers.length > 0
        ? [
            db.teacherPhoneNumber.createMany({
              data: parsed.phoneNumbers.map((p) => ({
                teacherId,
                schoolId,
                phoneType: p.phoneType,
                phoneNumber: p.phoneNumber,
                isPrimary: p.isPrimary,
              })),
            }),
          ]
        : []),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
