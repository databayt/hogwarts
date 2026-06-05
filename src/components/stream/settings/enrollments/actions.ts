"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Bound the batch so a single call can't enqueue an unbounded createMany.
const bulkEnrollSchema = z.object({
  catalogSubjectId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1).max(500),
})

export interface EnrollmentRecord {
  id: string
  studentName: string | null
  studentEmail: string | null
  name: string
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
    // Safety cap to bound the payload (whole-table read + per-row progress
    // join). A future iteration should paginate the admin DataTable server-side
    // and replace the progress include with a _count projection.
    take: 500,
  })

  return enrollments.map((e) => ({
    id: e.id,
    studentName: e.user.username,
    studentEmail: e.user.email,
    name: e.subject.name,
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

  const parsed = bulkEnrollSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, enrolled: 0, message: "Invalid request" }
  }
  const { catalogSubjectId, userIds } = parsed.data

  // Verify subject exists (catalog Subject is platform-global by design).
  const subject = await db.subject.findUnique({
    where: { id: catalogSubjectId },
    select: { id: true, name: true },
  })

  if (!subject) {
    return { success: false, enrolled: 0, message: "Subject not found" }
  }

  // Tenant safety: only enroll userIds that actually belong to THIS school.
  // Without this, the action would write Enrollment rows for arbitrary foreign
  // userIds (cross-tenant association). Drop any id not in the current school.
  const members = await db.user.findMany({
    where: { id: { in: userIds }, schoolId },
    select: { id: true },
  })
  const memberIds = members.map((m) => m.id)

  if (memberIds.length === 0) {
    return {
      success: false,
      enrolled: 0,
      message: "No valid students for this school",
    }
  }

  // Get existing enrollments to skip duplicates (scoped to current school)
  const existing = await db.enrollment.findMany({
    where: {
      catalogSubjectId,
      userId: { in: memberIds },
      schoolId,
    },
    select: { userId: true },
  })

  const existingUserIds = new Set(existing.map((e) => e.userId))
  const newUserIds = memberIds.filter((id) => !existingUserIds.has(id))

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
