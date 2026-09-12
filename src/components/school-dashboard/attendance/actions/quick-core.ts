// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// NOT a "use server" module on purpose: the quick action (quick.ts) and the
// offline sync route (api/offline/sync) both call this, and a "use server"
// export would become a client-callable endpoint of its own.
import { z } from "zod"

import { db } from "@/lib/db"

import { markAttendance } from "./core"

export const quickSubmitSchema = z.object({
  sectionId: z.string().min(1),
  date: z.string().min(1),
  absentStudentIds: z.array(z.string()).default([]),
  lateStudentIds: z.array(z.string()).default([]),
})

export type QuickSubmitInput = z.infer<typeof quickSubmitSchema>

export type QuickSubmitSummary = {
  total: number
  present: number
  absent: number
  late: number
  guardiansNotified: number
}

export type QuickSubmitResult =
  | ({ status: "marked" } & QuickSubmitSummary)
  /** A TEACHER submitted a section they do not own. */
  | { status: "forbidden" }
  | { status: "noStudents" }
  /** Replay of an offline mark older than a mark already on the server. */
  | { status: "stale" }
  | { status: "failed"; error?: string }

/**
 * Split a section roster into the absent / late / present sets. Submitted ids
 * are intersected against the roster so a foreign studentId can never ride
 * along, and an id in both lists counts as absent.
 */
export function partitionRoster(
  rosterIds: readonly string[],
  absentStudentIds: readonly string[],
  lateStudentIds: readonly string[]
): {
  absentSet: Set<string>
  lateSet: Set<string>
  records: { studentId: string; status: "present" | "absent" | "late" }[]
} {
  const rosterSet = new Set(rosterIds)
  const absentSet = new Set(absentStudentIds.filter((id) => rosterSet.has(id)))
  const lateSet = new Set(
    lateStudentIds.filter((id) => rosterSet.has(id) && !absentSet.has(id))
  )
  const records = rosterIds.map((studentId) => ({
    studentId,
    status: absentSet.has(studentId)
      ? ("absent" as const)
      : lateSet.has(studentId)
        ? ("late" as const)
        : ("present" as const),
  }))
  return { absentSet, lateSet, records }
}

/**
 * Absent-oriented submission: everyone in the section is PRESENT except the
 * listed absent/late students. Delegates to markAttendance (revive-on-update,
 * auto-excuse, guardian notifications) after enforcing teacher-section
 * ownership, and reports how many absent students have a notifiable guardian.
 *
 * `at` is the moment the mark was made on the device. When given (offline
 * replay), a section already marked on the server AFTER that moment wins and
 * the replay is reported `stale` — the device drops it as a duplicate. A
 * replayed absence still fires the guardian notification, at drain time;
 * that is correct and documented in the attendance block record.
 */
export async function submitQuickAttendanceCore(opts: {
  schoolId: string
  userId: string
  role: string
  input: QuickSubmitInput
  at?: Date
}): Promise<QuickSubmitResult> {
  const { schoolId, userId, role, input, at } = opts

  // SCOPE: a TEACHER may only quick-mark sections they own (homeroom or a
  // timetable slot on any day) — markAttendance itself is role-gated only.
  if (role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    const owned = teacher
      ? await db.section.findFirst({
          where: {
            id: input.sectionId,
            schoolId,
            OR: [
              { homeroomTeacherId: teacher.id },
              { timetables: { some: { schoolId, teacherId: teacher.id } } },
            ],
          },
          select: { id: true },
        })
      : null
    if (!owned) return { status: "forbidden" }
  }

  // Roster from the section (tenant-scoped).
  const roster = await db.student.findMany({
    where: { schoolId, sectionId: input.sectionId },
    select: { id: true },
  })
  if (roster.length === 0) return { status: "noStudents" }

  if (at) {
    const newer = await db.attendance.findFirst({
      where: {
        schoolId,
        sectionId: input.sectionId,
        date: new Date(input.date),
        updatedAt: { gt: at },
      },
      select: { id: true },
    })
    if (newer) return { status: "stale" }
  }

  const { absentSet, lateSet, records } = partitionRoster(
    roster.map((s) => s.id),
    input.absentStudentIds,
    input.lateStudentIds
  )

  const marked = await markAttendance({
    sectionId: input.sectionId,
    date: input.date,
    records,
  })
  if (!marked.success) return { status: "failed", error: marked.error }

  // How many of the absent students have at least one guardian with a user
  // account (i.e. will actually receive the absence notification)? Excused
  // students (approved intention) are not notified — mirror that here.
  let guardiansNotified = 0
  if (absentSet.size > 0) {
    const attendanceDate = new Date(input.date)
    const [excused, notifiable] = await Promise.all([
      db.absenceIntention.findMany({
        where: {
          schoolId,
          status: "APPROVED",
          dateFrom: { lte: attendanceDate },
          dateTo: { gte: attendanceDate },
          studentId: { in: [...absentSet] },
        },
        select: { studentId: true },
      }),
      db.studentGuardian.findMany({
        where: {
          schoolId,
          studentId: { in: [...absentSet] },
          guardian: { userId: { not: null } },
        },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ])
    const excusedSet = new Set(excused.map((e) => e.studentId))
    guardiansNotified = notifiable.filter(
      (n) => !excusedSet.has(n.studentId)
    ).length
  }

  return {
    status: "marked",
    total: roster.length,
    present: roster.length - absentSet.size - lateSet.size,
    absent: absentSet.size,
    late: lateSet.size,
    guardiansNotified,
  }
}
