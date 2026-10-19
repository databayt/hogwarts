// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { RecentActivityContent } from "@/components/school-dashboard/attendance/recent/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const d = (await getDictionary(lang)) as any
  const title = d?.school?.attendance?.title ?? "Attendance"
  const section = d?.attendanceHub?.sections?.reports?.recent ?? "Activity"
  return { title: `${title} · ${section}` }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Recent activity surfaces every student's marking history across the
  // school — a staff dashboard, not a student/guardian view. Inline denial,
  // not redirect() (React #310 — see (school-dashboard)/layout.tsx).
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  const dictionary = await getDictionary(lang)

  return <RecentActivityContent locale={lang} />
}
