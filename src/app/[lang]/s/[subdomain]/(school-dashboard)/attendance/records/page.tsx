// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { RecordsContent } from "@/components/school-dashboard/attendance/records/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.records || "My Attendance Records",
    description: "View your attendance records",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
const RECORDS_ROLES = ["STUDENT", "GUARDIAN"]

export default async function Page({ params }: Props) {
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])

  const role = session?.user?.role ?? ""

  // Staff should use Reports instead of Records
  if (STAFF_ROLES.includes(role)) {
    redirect(`/${lang}/attendance/reports`)
  }

  // Page-level gate: records is the STUDENT/GUARDIAN self-view. The data
  // actions are ownership-scoped anyway, but every other attendance page
  // denies inline — this one previously fell through for any non-staff role.
  if (!RECORDS_ROLES.includes(role)) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <RecordsContent locale={lang} subdomain={subdomain} />
}
