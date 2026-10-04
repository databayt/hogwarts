// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

import { AttendanceView } from "./view"

interface Props {
  lang?: Locale
  dictionary?: Dictionary
}

export async function ParentAttendanceContent({
  lang,
  dictionary,
}: Props = {}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Check if user is a parent/guardian
  const guardian = await db.guardian.findFirst({
    where: {
      userId: session.user.id,
      schoolId: session.user.schoolId!,
    },
    include: {
      studentGuardians: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              sectionId: true,
              attendances: {
                // Display read — exclude soft-deleted records (matches
                // getGuardianChildrenAttendance + getParentAttendanceSummary).
                where: { deletedAt: null },
                orderBy: {
                  date: "desc",
                },
                take: 90, // Last 90 days
                select: {
                  id: true,
                  date: true,
                  status: true,
                  notes: true,
                  // A period mark's subject comes from its timetable slot; a
                  // legacy mark's from its class
                  timetableId: true,
                  class: {
                    select: {
                      subjectId: true,
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!guardian) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          {dictionary?.parentPortal?.childAttendance?.noAccess ??
            "You don't have access to parent portal."}
        </p>
      </div>
    )
  }

  // Resolve display names/labels in ONE batched, deduped pass (student +
  // teacher names via getNames, subject/class labels via getLabels) so the
  // view never renders raw stored-language text.
  const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"
  const schoolId = session.user.schoolId!

  // Each child's subjects and who teaches them in the child's section this
  // term, and the subject of every period mark (from its timetable slot).
  const children = guardian.studentGuardians.map((sg) => sg.student)
  const sectionIds = [
    ...new Set(
      children.map((c) => c.sectionId).filter((id): id is string => !!id)
    ),
  ]
  const slotIds = [
    ...new Set(
      children.flatMap((c) =>
        c.attendances
          .map((a) => a.timetableId)
          .filter((id): id is string => !!id)
      )
    ),
  ]
  const [{ term }, slots] = await Promise.all([
    resolveActiveTerm(schoolId),
    slotIds.length > 0
      ? db.timetable.findMany({
          where: { schoolId, id: { in: slotIds } },
          select: {
            id: true,
            subjectId: true,
            subject: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ])
  const teachings =
    term && sectionIds.length > 0
      ? await db.subjectTeacher.findMany({
          where: { schoolId, termId: term.id, sectionId: { in: sectionIds } },
          select: {
            sectionId: true,
            subjectId: true,
            subject: { select: { name: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        })
      : []
  const slotSubject = new Map(
    slots
      .filter((slot) => slot.subjectId && slot.subject)
      .map((slot) => [
        slot.id,
        { id: slot.subjectId as string, name: slot.subject!.name },
      ])
  )
  const markSubject = (a: (typeof children)[number]["attendances"][number]) =>
    (a.timetableId ? slotSubject.get(a.timetableId) : undefined) ??
    (a.class?.subjectId && a.class.subject
      ? { id: a.class.subjectId, name: a.class.subject.name }
      : null)

  const allTeachers = teachings.map((row) => row.teacher)
  const allLabels = [
    ...teachings.map((row) => row.subject.name),
    ...children.flatMap((c) => c.attendances.map((a) => markSubject(a)?.name)),
  ]
  const [studentNames, teacherNames, labels] = await Promise.all([
    getNames(
      guardian.studentGuardians,
      (sg) => sg.student,
      displayLang,
      schoolId
    ),
    getNames(allTeachers, (t) => t, displayLang, schoolId),
    getLabels(allLabels, displayLang, schoolId),
  ])
  const t = (v: string | null | undefined) => (v ? (labels.get(v) ?? v) : "")

  // Prepare data for the view
  const students = guardian.studentGuardians.map((sg) => {
    const rawStudent = fullName(sg.student)
    return {
      id: sg.student.id,
      name: studentNames.get(rawStudent) ?? rawStudent,
      email: null as string | null,
      // The filter offers the child's subjects: those taught in their
      // section this term, then any other subject their marks name
      classes: (() => {
        const options = new Map<
          string,
          { id: string; name: string; teacher: string }
        >()
        for (const row of teachings) {
          if (row.sectionId !== sg.student.sectionId) continue
          const rawTeacher = fullName(row.teacher)
          options.set(row.subjectId, {
            id: row.subjectId,
            name: t(row.subject.name),
            teacher: teacherNames.get(rawTeacher) ?? rawTeacher,
          })
        }
        for (const a of sg.student.attendances) {
          const subject = markSubject(a)
          if (subject && !options.has(subject.id)) {
            options.set(subject.id, {
              id: subject.id,
              name: t(subject.name),
              teacher: "N/A",
            })
          }
        }
        return [...options.values()]
      })(),
      attendances: sg.student.attendances.map((a) => {
        const subject = markSubject(a)
        return {
          id: a.id,
          date: a.date,
          status: a.status,
          classId: subject?.id ?? "",
          className: t(subject?.name),
          notes: a.notes,
        }
      }),
    }
  })

  return <AttendanceView students={students} />
}
