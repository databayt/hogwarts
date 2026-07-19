// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { RecentActivityContent } from "@/components/school-dashboard/attendance/recent/content"

export const metadata = { title: "Dashboard: Recent Attendance Activity" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  // Independent awaits parallelized (params + auth + dictionary).
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Recent activity surfaces every student's marking history across the
  // school — a staff dashboard, not a student/guardian view. Inline denial,
  // not redirect() (React #310 — see (school-dashboard)/layout.tsx).
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  const dictionary = await getDictionary(lang)

  return (
    <RecentActivityContent
      dictionary={dictionary.school}
      locale={lang}
      userRole={session?.user?.role as UserRole | undefined}
    />
  )
}
