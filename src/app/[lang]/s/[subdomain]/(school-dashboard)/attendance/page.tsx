// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceOverviewContent } from "@/components/school-dashboard/attendance/overview/content"
import { StudentGuardianOverview } from "@/components/school-dashboard/attendance/overview/student-guardian-overview"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.title || "Attendance",
    description:
      dictionary?.school?.attendance?.overview || "Manage student attendance",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])

  const role = session?.user?.role ?? ""
  const isStaff = STAFF_ROLES.includes(role)

  if (!isStaff) {
    return <StudentGuardianOverview locale={lang} subdomain={subdomain} />
  }

  return <AttendanceOverviewContent locale={lang} subdomain={subdomain} />
}
