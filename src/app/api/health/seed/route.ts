import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Health check endpoint for demo school seed status
 *
 * GET /api/health/seed
 *
 * Returns:
 * - 200: Demo school exists and is healthy
 * - 503: Demo school is missing (needs seeding)
 *
 * This endpoint is useful for:
 * - Monitoring demo environment health
 * - Triggering alerts if seed data is lost
 * - Vercel health checks
 */
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
    });

    if (!demoSchool) {
      return NextResponse.json(
        {
          status: "error",
          message: "Demo school not found",
          suggestion: "Run: tsx prisma/seeds/ensure-demo.ts",
        },
        { status: 503 }
      );
    }

    // Get counts separately
    const [studentCount, teacherCount, userCount] = await Promise.all([
      db.student.count({ where: { schoolId: demoSchool.id } }),
      db.teacher.count({ where: { schoolId: demoSchool.id } }),
      db.user.count({ where: { schoolId: demoSchool.id } }),
    ]);

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
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
