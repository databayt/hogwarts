// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import { attendanceRatePercent } from "./overview"

/**
 * Real class-attendance rate: student seats that actually joined, over seats
 * expected, across non-cancelled, non-practice live classes that already
 * started in the last `days` days. `null` when no class was held.
 */
export async function classAttendanceRate(
  schoolId: string,
  days = 14,
  now = new Date()
): Promise<{ rate: number | null; expected: number; joined: number }> {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const sessionWhere = {
    schoolId,
    sectionId: { not: null },
    scheduledStart: { gte: since, lte: now },
    status: { not: "cancelled" as const },
    isPractice: false,
    deletedAt: null,
  }
  const [perSection, joined] = await Promise.all([
    db.conference.groupBy({
      by: ["sectionId"],
      where: sessionWhere,
      _count: { _all: true },
    }),
    db.conferenceParticipant.count({
      where: {
        schoolId,
        role: "PARTICIPANT",
        joinedAt: { not: null },
        session: sessionWhere,
      },
    }),
  ])
  const sectionIds = perSection.map((r) => r.sectionId as string)
  if (sectionIds.length === 0) return { rate: null, expected: 0, joined: 0 }
  const students = await db.student.groupBy({
    by: ["sectionId"],
    where: { schoolId, sectionId: { in: sectionIds } },
    _count: { _all: true },
  })
  const seats = new Map(
    students.map((r) => [r.sectionId as string, r._count._all])
  )
  let expected = 0
  for (const r of perSection) {
    expected += r._count._all * (seats.get(r.sectionId as string) ?? 0)
  }
  return { rate: attendanceRatePercent(expected, joined), expected, joined }
}
