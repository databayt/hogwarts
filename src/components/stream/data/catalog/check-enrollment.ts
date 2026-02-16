"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

/**
 * Checks if current user is enrolled in a catalog subject.
 * Migration: Replaces check-enrollment.ts which queries StreamEnrollment.
 *
 * Note: schoolId is optional — individuals can enroll without a school.
 */
export async function checkCatalogEnrollment(
  catalogSubjectId: string,
  schoolId: string | null
) {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      catalogSubjectId,
      isActive: true,
      ...(schoolId ? { schoolId } : {}),
    },
  })

  return !!enrollment
}
