// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { isRecordingConfigured } from "@/components/school-dashboard/live/livekit/client"
import { ScheduleLiveClassForm } from "@/components/school-dashboard/live/schedule-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) redirect(`/${lang}/dashboard`)

  const userId = session?.user?.id ?? ""

  const [dictionary, sections, subjects, teacher] = await Promise.all([
    getDictionary(lang),
    db.section.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.subject.findMany({
      where: {
        timetableSlots: { some: { schoolId } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    role === "TEACHER"
      ? db.teacher.findFirst({
          where: { schoolId, userId },
          select: { id: true },
        })
      : null,
  ])

  // An admin picks the host from the school's teachers; it used to be the
  // first teacher by createdAt, silently, which put every admin-scheduled
  // class on one person's calendar. A teacher hosts their own and gets no
  // picker (the action enforces that too).
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"
  const teachers = isAdmin
    ? (
        await db.teacher.findMany({
          where: { schoolId },
          select: { id: true, firstName: true, lastName: true },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          take: 500,
        })
      ).map((x) => ({
        id: x.id,
        name: [x.firstName, x.lastName].filter(Boolean).join(" "),
      }))
    : []
  const teacherId: string | null = teacher?.id ?? null

  return (
    <div>
      <ScheduleLiveClassForm
        locale={lang}
        dictionary={dictionary}
        sections={sections}
        subjects={subjects}
        teacherId={teacherId}
        teachers={teachers}
        recordingAvailable={isRecordingConfigured()}
      />
    </div>
  )
}
