// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ScheduleLiveClassForm } from "@/components/school-dashboard/live-classes/schedule/schedule-form"

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

  // For admin/dev, allow picking any teacher in school. For pilot, default
  // to the first active teacher if no user-teacher mapping.
  let teacherId: string | null = teacher?.id ?? null
  if (!teacherId && (role === "ADMIN" || role === "DEVELOPER")) {
    const firstTeacher = await db.teacher.findFirst({
      where: { schoolId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })
    teacherId = firstTeacher?.id ?? null
  }

  return (
    <div className="p-6">
      <ScheduleLiveClassForm
        locale={lang}
        dictionary={dictionary}
        sections={sections}
        subjects={subjects}
        teacherId={teacherId}
      />
    </div>
  )
}
