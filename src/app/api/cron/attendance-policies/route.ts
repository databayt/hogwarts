import { NextResponse } from "next/server"

import { db } from "@/lib/db"

/**
 * Cron job to evaluate attendance policies and create triggers for students
 * who exceed absence thresholds
 *
 * Schedule: Nightly at 1 AM (cron: 0 1 * * *)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Evaluating attendance policies...")

    const stats = {
      schoolsProcessed: 0,
      studentsEvaluated: 0,
      triggersCreated: 0,
    }

    // 1. Get all active schools
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    stats.schoolsProcessed = schools.length

    // 2. For each school, evaluate policies
    for (const school of schools) {
      // Get active term for this school
      const activeTerm = await db.term.findFirst({
        where: {
          schoolId: school.id,
          isActive: true,
        },
      })

      if (!activeTerm) {
        console.log(
          `[Cron] No active term for school ${school.name}, skipping...`
        )
        continue
      }

      // 3. Count absences per student in the current term
      const absenceCounts = await db.attendance.groupBy({
        by: ["studentId"],
        where: {
          schoolId: school.id,
          status: "ABSENT",
          date: { gte: activeTerm.startDate },
          deletedAt: null,
        },
        _count: true,
      })

      // 4. Get existing triggers to avoid duplicates
      const existingTriggers = await db.policyTrigger.findMany({
        where: { schoolId: school.id },
        select: {
          studentId: true,
          policyId: true,
          tier: true,
        },
      })

      const triggerKey = (studentId: string, tier: number) =>
        `${studentId}-default-${tier}`
      const existingTriggerSet = new Set(
        existingTriggers.map((t) => triggerKey(t.studentId, t.tier))
      )

      // 5. Get active exemptions
      const exemptions = await db.policyExemption.findMany({
        where: {
          schoolId: school.id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { studentId: true },
      })

      const exemptStudents = new Set(exemptions.map((e) => e.studentId))

      // 6. Get school admins for notifications
      const admins = await db.user.findMany({
        where: {
          schoolId: school.id,
          role: "ADMIN",
        },
        select: { id: true },
      })

      // 7. Evaluate thresholds for each student
      for (const record of absenceCounts) {
        const studentId = record.studentId
        const absenceCount = record._count

        stats.studentsEvaluated++

        // Skip if student is exempt
        if (exemptStudents.has(studentId)) {
          continue
        }

        // Define thresholds and actions
        const thresholds = [
          { count: 15, tier: 4, action: "REFERRAL" },
          { count: 10, tier: 3, action: "MEETING" },
          { count: 5, tier: 2, action: "LETTER" },
          { count: 3, tier: 1, action: "NOTIFICATION" },
        ]

        // Check thresholds from highest to lowest
        for (const threshold of thresholds) {
          if (absenceCount >= threshold.count) {
            const key = triggerKey(studentId, threshold.tier)

            // Only create if trigger doesn't already exist
            if (!existingTriggerSet.has(key)) {
              // Create policy trigger
              await db.policyTrigger.create({
                data: {
                  schoolId: school.id,
                  studentId,
                  policyId: "default",
                  tier: threshold.tier,
                  absenceCount,
                  action: threshold.action,
                  status: "PENDING",
                  notes: `Auto-generated: ${absenceCount} absences in current term`,
                },
              })

              stats.triggersCreated++

              // Create notification for admins
              for (const admin of admins) {
                await db.notification.create({
                  data: {
                    schoolId: school.id,
                    userId: admin.id,
                    type: "attendance_alert",
                    priority: threshold.tier >= 3 ? "high" : "normal",
                    title: "Attendance Policy Triggered",
                    body: `Student has reached ${absenceCount} absences (Tier ${threshold.tier} - ${threshold.action})`,
                    metadata: {
                      entityType: "policyTrigger",
                      studentId,
                      tier: threshold.tier,
                      absenceCount,
                      action: threshold.action,
                    },
                    channels: ["in_app"],
                  },
                })
              }

              console.log(
                `[Cron] Created Tier ${threshold.tier} trigger for student ${studentId} - ${absenceCount} absences`
              )
            }

            // Only trigger the highest applicable tier
            break
          }
        }
      }
    }

    console.log(
      `[Cron] Completed: ${stats.schoolsProcessed} schools processed, ${stats.studentsEvaluated} students evaluated, ${stats.triggersCreated} triggers created`
    )

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to evaluate attendance policies:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
