"use server"
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"

import { readCourseProgress, type CourseProgressData } from "./course-progress-core"

export type { CourseProgressData }

/**
 * Get the current user's progress for a specific course (subject).
 * Returns null if user is not enrolled or not authenticated.
 */
export async function getCourseProgress(
  subjectId: string
): Promise<CourseProgressData | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const { schoolId } = await getTenantContext()
  return readCourseProgress(subjectId, session.user.id, schoolId)
}
