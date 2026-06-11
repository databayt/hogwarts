// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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

  // Prepare data for the view
  const students = guardian.studentGuardians.map((sg) => ({
    id: sg.student.id,
    name: `${sg.student.firstName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.lastName}`,
    email: null as string | null,
    classes: sg.student.studentClasses.map((sc) => ({
      id: sc.class.id,
      name: `${sc.class.subject.name} - ${sc.class.name}`,
      teacher: sc.class.teacher
        ? `${sc.class.teacher.firstName} ${sc.class.teacher.lastName}`
        : "N/A",
    })),
    attendances: sg.student.attendances.map((a) => ({
      id: a.id,
      date: a.date,
      status: a.status,
      classId: a.classId ?? "",
      className: a.class?.subject?.name ?? "",
      notes: a.notes,
    })),
  }))

  return <AttendanceView students={students} />
}
