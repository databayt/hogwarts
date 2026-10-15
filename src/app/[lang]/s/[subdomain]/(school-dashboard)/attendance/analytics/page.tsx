// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { resolveActiveTerm } from "@/lib/term-resolver"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AnalyticsContent from "@/components/school-dashboard/attendance/analytics/content"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const d = (await getDictionary(lang)) as any
  const title = d?.school?.attendance?.title ?? "Attendance"
  const section = d?.attendanceHub?.sections?.reports?.overview ?? "Overview"
  return { title: `${title} · ${section}` }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const { lang } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  // The "This term" preset needs the active term's dates; no term → no preset.
  const schoolId = session?.user?.schoolId
  const { term } = schoolId
    ? await resolveActiveTerm(schoolId).catch(() => ({ term: null }))
    : { term: null }

  return (
    <AnalyticsContent
      dictionary={dictionary}
      locale={lang}
      term={
        term
          ? {
              from: term.startDate.toISOString(),
              to: term.endDate.toISOString(),
            }
          : null
      }
    />
  )
}
