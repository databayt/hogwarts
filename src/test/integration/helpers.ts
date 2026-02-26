// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Integration Test Helpers
 *
 * Real database helpers for integration tests.
 * These create actual records in a Neon branch database.
 */

import { db } from "@/lib/db"

/**
 * Create a test school with a unique domain
 */
export async function createTestSchool(overrides?: {
  name?: string
  domain?: string
}) {
  const suffix = Math.random().toString(36).substring(2, 8)
  return db.school.create({
    data: {
      name: overrides?.name ?? `Test School ${suffix}`,
      domain: overrides?.domain ?? `test-${suffix}`,
      email: `admin@test-${suffix}.com`,
      planType: "basic",
      maxStudents: 100,
      maxTeachers: 20,
      isActive: true,
    },
  })
}

/**
 * Clean up test data created during a test
 */
export async function cleanupTestData(schoolId: string) {
  await db.$transaction([
    db.student.deleteMany({ where: { schoolId } }),
    db.teacher.deleteMany({ where: { schoolId } }),
    db.class.deleteMany({ where: { schoolId } }),
    db.attendance.deleteMany({ where: { schoolId } }),
    db.school.delete({ where: { id: schoolId } }),
  ])
}
