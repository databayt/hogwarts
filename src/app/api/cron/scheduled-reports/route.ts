import { NextResponse } from "next/server"

import { db } from "@/lib/db"

/**
 * Cron job to process scheduled attendance reports
 * Generates reports, updates run times, and creates notifications for recipients
 *
 * Schedule: Every 6 hours (cron: 0 star-slash-6 star star star)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Processing scheduled attendance reports...")

    const stats = {
      reportsProcessed: 0,
      notificationsCreated: 0,
      errors: 0,
      nextScheduled: [] as Array<{ name: string; nextRun: Date }>,
    }

    // 1. Find reports due for execution
    const now = new Date()
    const dueReports = await db.attendanceReport.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        school: {
          select: { id: true, name: true },
        },
      },
    })

    console.log(`[Cron] Found ${dueReports.length} reports due for execution`)

    // 2. Process each report
    for (const report of dueReports) {
      try {
        // Calculate next run time based on frequency
        const nextRunAt = calculateNextRun(now, report.frequency)

        // Update report run times
        await db.attendanceReport.update({
          where: { id: report.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        })

        // 3. Create notifications for recipients
        // Get recipient user IDs (recipients array can contain user IDs or emails)
        const recipientUsers = await db.user.findMany({
          where: {
            schoolId: report.schoolId,
            OR: [
              { id: { in: report.recipients } },
              { email: { in: report.recipients } },
            ],
          },
          select: { id: true },
        })

        // Create in-app notification for each recipient
        for (const user of recipientUsers) {
          await db.notification.create({
            data: {
              schoolId: report.schoolId,
              userId: user.id,
              type: "report_ready",
              priority: "normal",
              title: `Attendance Report: ${report.name}`,
              body: `Your scheduled ${report.frequency.toLowerCase()} attendance report "${report.name}" is ready to view.`,
              metadata: {
                entityType: "attendanceReport",
                reportId: report.id,
                reportName: report.name,
                reportType: report.type,
                generatedAt: now.toISOString(),
              },
              channels: ["in_app"],
            },
          })

          stats.notificationsCreated++
        }

        stats.reportsProcessed++
        stats.nextScheduled.push({
          name: report.name,
          nextRun: nextRunAt,
        })

        console.log(
          `[Cron] Processed report "${report.name}" for school ${report.school.name}. Next run: ${nextRunAt.toISOString()}`
        )
      } catch (error) {
        stats.errors++
        console.error(
          `[Cron] Error processing report ${report.id}:`,
          error instanceof Error ? error.message : error
        )
        // Continue processing other reports even if one fails
      }
    }

    console.log(
      `[Cron] Completed: ${stats.reportsProcessed} reports processed, ${stats.notificationsCreated} notifications created, ${stats.errors} errors`
    )

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to process scheduled reports:", error)

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

/**
 * Calculate next run time based on report frequency
 */
function calculateNextRun(from: Date, frequency: string): Date {
  const nextRun = new Date(from)

  switch (frequency) {
    case "DAILY":
      nextRun.setDate(nextRun.getDate() + 1)
      break
    case "WEEKLY":
      nextRun.setDate(nextRun.getDate() + 7)
      break
    case "BIWEEKLY":
      nextRun.setDate(nextRun.getDate() + 14)
      break
    case "MONTHLY":
      nextRun.setMonth(nextRun.getMonth() + 1)
      break
    case "QUARTERLY":
      nextRun.setMonth(nextRun.getMonth() + 3)
      break
    case "SEMESTER":
      nextRun.setMonth(nextRun.getMonth() + 6)
      break
    case "YEARLY":
      nextRun.setFullYear(nextRun.getFullYear() + 1)
      break
    case "ON_DEMAND":
      // ON_DEMAND reports don't auto-schedule
      // Set nextRunAt far in future so they don't auto-run
      nextRun.setFullYear(nextRun.getFullYear() + 100)
      break
    default:
      // Default to daily if unknown frequency
      nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}
