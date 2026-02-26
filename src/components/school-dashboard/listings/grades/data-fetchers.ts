"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get classes for grade entry dropdowns
 */
export async function getSchoolClasses(): Promise<
  ActionResponse<Array<{ id: string; name: string }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: classes }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes",
    }
  }
}

/**
 * Get students, optionally filtered by class
 */
export async function getSchoolStudents(
  classId?: string
): Promise<
  ActionResponse<Array<{ id: string; givenName: string; surname: string }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const where: any = { schoolId }
    if (classId) {
      where.studentClasses = { some: { classId } }
    }

    const students = await db.student.findMany({
      where,
      select: { id: true, givenName: true, surname: true },
      orderBy: [{ surname: "asc" }, { givenName: "asc" }],
      take: 200,
    })

    return { success: true, data: students }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch students",
    }
  }
}

/**
 * Get assignments, optionally filtered by class
 */
export async function getSchoolAssignments(
  classId?: string
): Promise<
  ActionResponse<Array<{ id: string; title: string; totalPoints: number }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const where: any = { schoolId }
    if (classId) {
      where.classId = classId
    }

    const assignments = await db.assignment.findMany({
      where,
      select: { id: true, title: true, totalPoints: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return {
      success: true,
      data: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        totalPoints: Number(a.totalPoints),
      })),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch assignments",
    }
  }
}
