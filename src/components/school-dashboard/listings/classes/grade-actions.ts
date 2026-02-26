"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function getAcademicGrades(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; gradeNumber: number }>
  error?: string
}> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school" }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true, gradeNumber: true },
      orderBy: { gradeNumber: "asc" },
    })

    return { success: true, data: grades }
  } catch (error) {
    console.error("[getAcademicGrades]", error)
    return { success: false, error: "Failed to fetch grades" }
  }
}
