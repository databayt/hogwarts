// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { verifyCronSecret } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { displayName } from "@/lib/name-utils"
import { schoolCalendarDayOf } from "@/lib/timezone"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfWeek,
  slotInstantsOn,
} from "@/components/school-dashboard/live/day-window"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"

/** A slot is reminded on the first hourly run inside this window after it ends. */
const REMIND_WINDOW_MS = 60 * 60 * 1000

/**
 * Cron job to check for unmarked attendance and send reminders to teachers.
 *
 * Schedule: hourly (cf/crons.json). Each slot is reminded at most ONCE: on the
 * first run inside the hour after its period ENDS, if its section still has no
 * mark for that period or the day. It used to remind for every slot of the day
 * on every run — including the ones that had not happened yet — on the
 * server's calendar day: alabidae's teachers received 357 reminders on
 * 2026-11-08, most of them for classes still hours away.
 *
 * Online classes with attendance sync on are left alone: the live room's
 * presence writes their register when the class ends (attendance-sync), so a
 * reminder would ask the teacher to do by hand what the room already did.
 */
export async function GET(request: Request) {
  // Verify cron secret for security (fail-closed when CRON_SECRET is unset)
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Checking for unmarked attendance...")

    const stats = {
      schoolsChecked: 0,
      classesChecked: 0,
      remindersCreated: 0,
      skippedOnline: 0,
    }

    // 1. Get all active schools
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        timezone: true,
        conferenceAttendanceSync: true,
      },
    })

    stats.schoolsChecked = schools.length
    const now = new Date()

    // 2. For each school, check unmarked attendance
    for (const school of schools) {
      // The SCHOOL's day, not the server's: the container runs in UTC, which
      // puts a Khartoum school on the wrong weekday for two hours each night.
      const tz = school.timezone || DEFAULT_SCHOOL_TZ
      const dayOfWeek = schoolDayOfWeek(tz, now)
      const { year, month, day } = schoolCalendarDayOf(now, tz)
      // `Attendance.date` is a DATE column: the school's calendar day at UTC
      // midnight is how that day is written and filtered.
      const todayDate = new Date(Date.UTC(year, month - 1, day))

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

      // 3. Today's timetable entries whose period ended within the last hour
      const timetableEntries = (
        await db.timetable.findMany({
          where: {
            schoolId: school.id,
            termId: activeTerm.id,
            dayOfWeek,
            weekOffset: 0,
            period: { isBreak: false },
          },
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                userId: true,
              },
            },
            section: {
              select: {
                id: true,
                name: true,
              },
            },
            period: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        })
      ).filter((entry) => {
        const at = slotInstantsOn(tz, now, entry.period)
        if (!at) return false
        const endedMs = now.getTime() - at.scheduledEnd.getTime()
        return endedMs >= 0 && endedMs < REMIND_WINDOW_MS
      })

      stats.classesChecked += timetableEntries.length
      if (timetableEntries.length === 0) continue

      // Sections whose classes are online today, when the room writes the
      // register — those are skipped below.
      const syncedOnline = school.conferenceAttendanceSync
        ? await resolveOnlinePolicies(
            school.id,
            timetableEntries
              .map((e) => e.sectionId)
              .filter((id): id is string => !!id),
            now
          )
        : new Map()

      // 4. Check which sections have NO attendance for today — neither this
      // period's marks nor the day's
      for (const entry of timetableEntries) {
        if (!entry.sectionId) continue
        if (syncedOnline.get(entry.sectionId)?.online) {
          stats.skippedOnline++
          continue
        }
        const attendanceExists = await db.attendance.findFirst({
          where: {
            schoolId: school.id,
            sectionId: entry.sectionId,
            OR: [{ periodId: entry.periodId }, { periodId: null }],
            date: todayDate,
            deletedAt: null, // deleted records must not suppress the reminder
          },
        })

        // 5. If no attendance record exists, create notification
        if (!attendanceExists && entry.teacher?.userId) {
          await dispatchNotification({
            schoolId: school.id,
            userId: entry.teacher.userId,
            type: "attendance_alert",
            priority: "normal",
            title: "Attendance Reminder",
            body: `Reminder: Attendance not yet marked for ${entry.section?.name ?? ""} - ${entry.period.name}`,
            metadata: {
              entityType: "attendance",
              sectionId: entry.sectionId,
              periodId: entry.periodId,
              date: todayDate.toISOString(),
            },
          })

          stats.remindersCreated++
          console.log(
            `[Cron] Created reminder for teacher ${displayName(entry.teacher, "full")} - ${entry.section?.name ?? ""}`
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
