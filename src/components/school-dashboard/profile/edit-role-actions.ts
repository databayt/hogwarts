"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Steps the user can edit on their own profile (not admin-only fields)
const SELF_EDITABLE_STEPS = {
  teacher: ["contact", "qualifications", "experience"],
  student: ["contact"],
} as const

type EntityType = keyof typeof SELF_EDITABLE_STEPS

/** Get the entity (teacher/student) linked to the current user */
export async function getOwnEntity(
  entityType: EntityType
): Promise<
  ActionResponse<{ entityId: string; data: Record<string, unknown> }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
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
            include: { subject: { select: { id: true, subjectName: true } } },
          },
        },
      })

      if (!teacher) {
        return { success: false, error: "Teacher profile not found" }
      }

      return {
        success: true,
        data: {
          entityId: teacher.id,
          data: teacher as unknown as Record<string, unknown>,
        },
      }
    }

    if (entityType === "student") {
      const student = await db.student.findFirst({
        where: { userId: session.user.id, schoolId },
      })

      if (!student) {
        return { success: false, error: "Student profile not found" }
      }

      return {
        success: true,
        data: {
          entityId: student.id,
          data: student as unknown as Record<string, unknown>,
        },
      }
    }

    return { success: false, error: "Invalid entity type" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load profile",
    }
  }
}

/** Check if a step is self-editable for the given entity type */
export async function canSelfEdit(
  entityType: EntityType,
  step: string
): Promise<boolean> {
  const allowed = SELF_EDITABLE_STEPS[entityType]
  return (allowed as readonly string[]).includes(step)
}

/** Get list of self-editable steps for an entity type */
export async function getSelfEditableSteps(
  entityType: EntityType
): Promise<string[]> {
  return [...SELF_EDITABLE_STEPS[entityType]]
}
