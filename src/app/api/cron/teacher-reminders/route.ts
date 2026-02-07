import { NextResponse } from "next/server"

import { db } from "@/lib/db"

/**
 * Cron job to check for unmarked attendance and send reminders to teachers
 *
 * Schedule: Every hour during school hours (cron: 0 8-16 * * 1-5)
 * Configure in vercel.json crons array
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Checking for unmarked attendance...")

    const stats = {
      schoolsChecked: 0,
      classesChecked: 0,
      remindersCreated: 0,
    }

    // 1. Get all active schools
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    stats.schoolsChecked = schools.length

    // Get current day of week (0 = Sunday, 6 = Saturday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayDate = new Date(today.setHours(0, 0, 0, 0))

    // 2. For each school, check unmarked attendance
    for (const school of schools) {
      // Get active term for this school
      const activeTerm = await db.term.findFirst({
        where: {
          schoolId: school.id,
          isActive: true,
        },
        select: { id: true },
      })

      if (!activeTerm) {
        console.log(
          `[Cron] No active term for school ${school.name}, skipping...`
        )
        continue
      }

      // 3. Find today's timetable entries
      const timetableEntries = await db.timetable.findMany({
        where: {
          schoolId: school.id,
          termId: activeTerm.id,
          dayOfWeek,
        },
        include: {
          teacher: {
            select: {
              id: true,
              givenName: true,
              surname: true,
              userId: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          period: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      stats.classesChecked += timetableEntries.length

      // 4. Check which classes have NO attendance records for today
      for (const entry of timetableEntries) {
        const attendanceExists = await db.attendance.findFirst({
          where: {
            schoolId: school.id,
            classId: entry.classId,
            periodId: entry.periodId,
            date: todayDate,
          },
        })

        // 5. If no attendance record exists, create notification
        if (!attendanceExists && entry.teacher.userId) {
          await db.notification.create({
            data: {
              schoolId: school.id,
              userId: entry.teacher.userId,
              type: "attendance_alert",
              priority: "normal",
              title: "Attendance Reminder",
              body: `Reminder: Attendance not yet marked for ${entry.class.name} - ${entry.period.name}`,
              metadata: {
                entityType: "attendance",
                classId: entry.classId,
                periodId: entry.periodId,
                date: todayDate.toISOString(),
              },
              channels: ["in_app"],
            },
          })

          stats.remindersCreated++
          console.log(
            `[Cron] Created reminder for teacher ${entry.teacher.givenName} ${entry.teacher.surname} - ${entry.class.name}`
          )
        }
      }
    }

    console.log(
      `[Cron] Completed: ${stats.schoolsChecked} schools checked, ${stats.classesChecked} classes reviewed, ${stats.remindersCreated} reminders created`
    )

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Failed to process attendance reminders:", error)

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
