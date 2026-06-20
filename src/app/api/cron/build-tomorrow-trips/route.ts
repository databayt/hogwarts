// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { getAbsentStudentIdsForDate } from "@/components/school-dashboard/transportation/lib/absence"
import { generateAndStoreTripPlan } from "@/components/school-dashboard/transportation/lib/plan"

export const dynamic = "force-dynamic"

/**
 * Nightly transport trip builder (absence-aware dynamic re-routing).
 *
 * Schedule: `0 20 * * *` (8 PM) — builds the NEXT day's SCHEDULED trips for every
 * ACTIVE route, pre-sets boardings (EXCUSED for absentees, PENDING for riders),
 * and — when the school enables optimization — re-optimizes each route over only
 * the present riders' stops so absent students (and now-empty stops) drop out.
 *
 * Working-day / holiday aware via SchoolWeekConfig + ScheduleException. The trip
 * upsert is idempotent (safe to re-run); boarding writes use skipDuplicates and a
 * PENDING→EXCUSED sweep so a re-run never double-creates or un-excuses.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "build-tomorrow-trips")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  const tomorrowEnd = new Date(tomorrow.getTime() + 86_400_000 - 1)
  const weekday = tomorrow.getUTCDay() // 0=Sun … 6=Sat

  let tripsCreated = 0
  let routesProcessed = 0
  let schoolsSkipped = 0

  try {
    const routes = await db.route.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        direction: true,
        departureTime: true,
        vehicleId: true,
        driverId: true,
      },
    })

    // Group routes by school so each school's working-day check runs once.
    const bySchool = new Map<string, typeof routes>()
    for (const r of routes) {
      const list = bySchool.get(r.schoolId) ?? []
      list.push(r)
      bySchool.set(r.schoolId, list)
    }

    for (const [schoolId, schoolRoutes] of bySchool) {
      // Working-day gate (if configured for this school).
      const weekCfg = await db.schoolWeekConfig.findFirst({
        where: { schoolId },
        select: { workingDays: true },
      })
      if (
        weekCfg &&
        weekCfg.workingDays.length > 0 &&
        !weekCfg.workingDays.includes(weekday)
      ) {
        schoolsSkipped++
        continue
      }

      // Holiday / cancelled-day gate.
      const holiday = await db.scheduleException.findFirst({
        where: {
          schoolId,
          exceptionType: { in: ["HOLIDAY", "CANCELLED"] },
          startDate: { lte: tomorrowEnd },
          endDate: { gte: tomorrow },
        },
        select: { id: true },
      })
      if (holiday) {
        schoolsSkipped++
        continue
      }

      const settings = await db.transportationSettings.findUnique({
        where: { schoolId },
        select: { enableRouteOptimization: true },
      })
      const absentSet = await getAbsentStudentIdsForDate(schoolId, tomorrow)

      for (const route of schoolRoutes) {
        try {
          const trip = await db.trip.upsert({
            where: {
              schoolId_routeId_scheduledDate_direction: {
                schoolId,
                routeId: route.id,
                scheduledDate: tomorrow,
                direction: route.direction,
              },
            },
            create: {
              schoolId,
              routeId: route.id,
              direction: route.direction,
              scheduledDate: tomorrow,
              scheduledTime: route.departureTime,
              vehicleId: route.vehicleId,
              driverId: route.driverId,
              status: "SCHEDULED",
            },
            update: {},
            select: { id: true },
          })

          const assignments = await db.routeAssignment.findMany({
            where: {
              schoolId,
              routeId: route.id,
              status: "ACTIVE",
              deletedAt: null,
            },
            select: { studentId: true, stopId: true },
          })

          const present = assignments.filter((a) => !absentSet.has(a.studentId))
          const absent = assignments.filter((a) => absentSet.has(a.studentId))

          if (assignments.length > 0) {
            await db.tripBoarding.createMany({
              data: [
                ...present.map((a) => ({
                  schoolId,
                  tripId: trip.id,
                  studentId: a.studentId,
                  stopId: a.stopId,
                  status: "PENDING" as const,
                })),
                ...absent.map((a) => ({
                  schoolId,
                  tripId: trip.id,
                  studentId: a.studentId,
                  stopId: a.stopId,
                  status: "EXCUSED" as const,
                })),
              ],
              skipDuplicates: true,
            })
            // Re-run safety: excuse absentees whose row already existed as PENDING.
            if (absent.length > 0) {
              await db.tripBoarding.updateMany({
                where: {
                  schoolId,
                  tripId: trip.id,
                  studentId: { in: absent.map((a) => a.studentId) },
                  status: "PENDING",
                },
                data: { status: "EXCUSED" },
              })
            }
          }

          // Re-optimize over only the present riders' stops.
          if (settings?.enableRouteOptimization && present.length > 0) {
            const presentStopIds = Array.from(
              new Set(present.map((a) => a.stopId))
            )
            await generateAndStoreTripPlan({
              schoolId,
              tripId: trip.id,
              routeId: route.id,
              direction: route.direction,
              stopIds: presentStopIds,
            })
          }

          tripsCreated++
          routesProcessed++
        } catch (err) {
          // One route's failure must not abort the whole batch.
          console.error("[build-tomorrow-trips] route failed", {
            schoolId,
            routeId: route.id,
            err: err instanceof Error ? err.message : err,
          })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      date: tomorrow.toISOString().slice(0, 10),
      tripsCreated,
      routesProcessed,
      schoolsSkipped,
    })
  } catch (err) {
    console.error("[build-tomorrow-trips] failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
