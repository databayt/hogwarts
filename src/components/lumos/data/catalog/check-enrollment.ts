"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

/**
 * Checks if current user is enrolled in a catalog subject.
 * Migration: Replaces check-enrollment.ts which queries StreamEnrollment.
 *
 * Note: schoolId is optional — individuals can enroll without a school.
 */
export async function checkCatalogEnrollment(catalogSubjectId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const enrollment = await db.enrollment.findFirst({
    where: {
      userId: session.user.id,
      catalogSubjectId,
      isActive: true,
    },
  })

  return !!enrollment
}
