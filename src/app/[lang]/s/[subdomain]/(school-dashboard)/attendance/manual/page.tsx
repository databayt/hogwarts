// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
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
  // Parallel data fetching
  const [{ lang }, dictionary, session] = await Promise.all([
    params,
    getDictionary((await params).lang),
    auth(),
  ])

  // Check permissions - staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access manual attendance marking.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider initialMethod="MANUAL">
      <AttendanceContent dictionary={dictionary.school} />
    </AttendanceProvider>
  )
}
