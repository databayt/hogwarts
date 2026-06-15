"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

type EntityType = "teacher" | "student"

/** Get the entity (teacher/student) linked to the current user */
export async function getOwnEntity(
  entityType: EntityType
): Promise<
  ActionResponse<{ entityId: string; data: Record<string, unknown> }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "NOT_AUTHENTICATED" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "MISSING_SCHOOL" }
    }

    if (entityType === "teacher") {
      const teacher = await db.teacher.findFirst({
        where: { userId: session.user.id, schoolId },
        include: {
          phoneNumbers: { where: { schoolId } },
          qualifications: { where: { schoolId } },
          experiences: { where: { schoolId } },
          subjectExpertise: {
            where: { schoolId },
            include: { subject: { select: { id: true, name: true } } },
          },
        },
      })

      if (!teacher) {
        return { success: false, error: "TEACHER_NOT_FOUND" }
      }

      return {
        success: true,
        data: {
          entityId: teacher.id,
          data: teacher as unknown as Record<string, unknown>,
        },
      }
    }

    const student = await db.student.findFirst({
      where: { userId: session.user.id, schoolId },
    })

    if (!student) {
      return { success: false, error: "STUDENT_NOT_FOUND" }
    }

    return {
      success: true,
      data: {
        entityId: student.id,
        data: student as unknown as Record<string, unknown>,
      },
    }
  } catch (error) {
    console.error("Error loading profile entity:", error)
    return { success: false, error: "LOAD_FAILED" }
  }
}
