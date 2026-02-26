"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

/**
 * Checks if current user is enrolled in a course
 * Multi-tenant: Scoped by schoolId
 */
export async function checkIfEnrolled(
  courseId: string,
  schoolId: string | null
) {
  if (!schoolId) {
    return false
  }

  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const enrollment = await db.streamEnrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId,
      schoolId,
      isActive: true,
    },
  })

  return !!enrollment
}
