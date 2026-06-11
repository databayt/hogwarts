// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
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
              studentClasses: {
                include: {
                  class: {
                    include: {
                      subject: true,
                      teacher: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
              attendances: {
                orderBy: {
                  date: "desc",
                },
                take: 90, // Last 90 days
                select: {
                  id: true,
                  date: true,
                  status: true,
                  classId: true,
                  notes: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
                      subject: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
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
  const allTeachers = guardian.studentGuardians.flatMap((sg) =>
    sg.student.studentClasses.flatMap((sc) =>
      sc.class.teacher ? [sc.class.teacher] : []
    )
  )
  const allLabels = guardian.studentGuardians.flatMap((sg) => [
    ...sg.student.studentClasses.flatMap((sc) => [
      sc.class.subject.name,
      sc.class.name,
    ]),
    ...sg.student.attendances.map((a) => a.class?.subject?.name),
  ])
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
      classes: sg.student.studentClasses.map((sc) => {
        const rawTeacher = sc.class.teacher ? fullName(sc.class.teacher) : ""
        return {
          id: sc.class.id,
          name: `${t(sc.class.subject.name)} - ${t(sc.class.name)}`,
          teacher: rawTeacher
            ? (teacherNames.get(rawTeacher) ?? rawTeacher)
            : "N/A",
        }
      }),
      attendances: sg.student.attendances.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        classId: a.classId ?? "",
        className: t(a.class?.subject?.name),
        notes: a.notes,
      })),
    }
  })

  return <AttendanceView students={students} />
}
