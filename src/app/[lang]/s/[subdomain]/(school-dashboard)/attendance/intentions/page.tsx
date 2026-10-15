// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import IntentionsContent from "@/components/school-dashboard/attendance/intentions/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const meta = (
    dictionary as { attendanceToday?: { meta?: Record<string, string> } }
  )?.attendanceToday?.meta
  return { title: meta?.intentions || "Attendance · Planned absences" }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session, { schoolId }] = await Promise.all([
    params,
    auth(),
    getTenantContext(),
  ])
  const role = session?.user?.role ?? ""

  // Staff review the queue; a guardian plans and follows their own
  // children's absences (the actions enforce ownership — getStudentIntentions
  // and submitAbsenceIntention check the guardian link).
  if (STAFF_ROLES.includes(role)) {
    return (
      <IntentionsContent locale={lang} schoolId={schoolId ?? ""} mode="staff" />
    )
  }
  if (role === "GUARDIAN") {
    return (
      <IntentionsContent
        locale={lang}
        schoolId={schoolId ?? ""}
        mode="guardian"
      />
    )
  }
  return <AttendanceAccessDenied lang={lang} />
}
