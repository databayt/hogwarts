"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { capacitySchema, type CapacityFormData } from "./validation"

export async function updateSchoolCapacity(
  schoolId: string,
  data: CapacityFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = capacitySchema.parse(data)

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        maxStudents: validated.studentCount,
        maxTeachers: validated.teachers,
        maxClasses: validated.classrooms ?? 20,
      },
    })

    revalidatePath(`/onboarding/${schoolId}/capacity`)
    return createActionResponse(updatedSchool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
      })
    }
    return createActionResponse(undefined, error)
  }
}

export async function getSchoolCapacity(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        maxStudents: true,
        maxTeachers: true,
        maxClasses: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      studentCount: school.maxStudents || 400,
      teachers: school.maxTeachers || 10,
      classrooms: school.maxClasses || 20,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
