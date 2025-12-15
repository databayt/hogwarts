/**
 * Demo School Health Check API
 *
 * Verifies the demo school exists and has expected seed data.
 *
 * USE CASES:
 * - CI/CD: Verify seed script ran successfully
 * - Monitoring: Alert if demo school is missing
 * - Debugging: Check demo environment state
 *
 * WHY DEMO SCHOOL SPECIFIC:
 * - Demo school is critical for onboarding/testing
 * - Other schools created via onboarding flow
 * - Demo needs seed data (students, teachers, etc.)
 *
 * STATUS CODES:
 * - 200: Demo school exists and is healthy
 * - 503: Demo school missing (trigger alert/reseed)
 *
 * RESPONSE INCLUDES:
 * - school: Basic info (id, name, domain, isActive)
 * - counts: Entity counts (students, teachers, users)
 * - timestamp: When check was performed
 *
 * WHY NO AUTH:
 * - Health checks are typically unauthenticated
 * - Load balancers need to check without credentials
 * - No sensitive data exposed (just counts)
 *
 * DOMAIN CHECK:
 * - Looks for school with domain="demo"
 * - This is the canonical demo school identifier
 *
 * @see prisma/seeds/ensure-demo.ts for seeding script
 */

import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export async function GET() {
  try {
    const demoSchool = await db.school.findUnique({
      where: { domain: "demo" },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      },
    })

    if (!demoSchool) {
      return NextResponse.json(
        {
          status: "error",
          message: "Demo school not found",
          suggestion: "Run: tsx prisma/seeds/ensure-demo.ts",
        },
        { status: 503 }
      )
    }

    // Get counts separately
    const [studentCount, teacherCount, userCount] = await Promise.all([
      db.student.count({ where: { schoolId: demoSchool.id } }),
      db.teacher.count({ where: { schoolId: demoSchool.id } }),
      db.user.count({ where: { schoolId: demoSchool.id } }),
    ])

    return NextResponse.json({
      status: "healthy",
      school: {
        id: demoSchool.id,
        name: demoSchool.name,
        domain: demoSchool.domain,
        isActive: demoSchool.isActive,
      },
      counts: {
        students: studentCount,
        teachers: teacherCount,
        users: userCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
