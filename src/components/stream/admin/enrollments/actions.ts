"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface EnrollmentRecord {
  id: string
  studentName: string | null
  studentEmail: string | null
  subjectName: string
  subjectSlug: string
  isActive: boolean
  status: string
  completedLessons: number
  createdAt: Date
}

export async function getSchoolEnrollments(): Promise<EnrollmentRecord[]> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) return []

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
    return []
  }

  const enrollments = await db.enrollment.findMany({
    where: { schoolId },
    include: {
      user: {
        select: { username: true, email: true },
      },
      subject: {
        select: { name: true, slug: true },
      },
      progress: {
        where: { isCompleted: true },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return enrollments.map((e) => ({
    id: e.id,
    studentName: e.user.username,
    studentEmail: e.user.email,
    subjectName: e.subject.name,
    subjectSlug: e.subject.slug,
    isActive: e.isActive,
    status: e.status,
    completedLessons: e.progress.length,
    createdAt: e.createdAt,
  }))
}

/**
 * Bulk enroll students into a catalog subject.
 */
export async function bulkEnrollStudents(data: {
  catalogSubjectId: string
  userIds: string[]
}): Promise<{ success: boolean; enrolled: number; message: string }> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user || !schoolId) {
    return { success: false, enrolled: 0, message: "Unauthorized" }
  }

  if (!["ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
    return { success: false, enrolled: 0, message: "Insufficient permissions" }
  }

  // Verify subject exists
  const subject = await db.catalogSubject.findUnique({
    where: { id: data.catalogSubjectId },
    select: { id: true, name: true },
  })

  if (!subject) {
    return { success: false, enrolled: 0, message: "Subject not found" }
  }

  // Get existing enrollments to skip duplicates
  const existing = await db.enrollment.findMany({
    where: {
      catalogSubjectId: data.catalogSubjectId,
      userId: { in: data.userIds },
    },
    select: { userId: true },
  })

  const existingUserIds = new Set(existing.map((e) => e.userId))
  const newUserIds = data.userIds.filter((id) => !existingUserIds.has(id))

  if (newUserIds.length === 0) {
    return {
      success: true,
      enrolled: 0,
      message: "All selected students are already enrolled",
    }
  }

  // Batch create enrollments
  await db.enrollment.createMany({
    data: newUserIds.map((userId) => ({
      userId,
      catalogSubjectId: data.catalogSubjectId,
      schoolId,
      isActive: true,
      status: "ACTIVE" as const,
    })),
  })

  revalidatePath("/stream/admin/enrollments")

  return {
    success: true,
    enrolled: newUserIds.length,
    message: `Successfully enrolled ${newUserIds.length} students in ${subject.name}`,
  }
}
