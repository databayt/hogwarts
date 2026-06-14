// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { AttendanceContent } from "@/components/school-dashboard/attendance/content"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.manual || "Manual Attendance",
    description: "Mark attendance manually for your class",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  // Resolve params once, then fetch dictionary + session in parallel.
  const { lang } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  // Check permissions - staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return (
    <AttendanceProvider initialMethod="MANUAL">
      <AttendanceContent dictionary={dictionary.school} lang={lang} />
    </AttendanceProvider>
  )
}
