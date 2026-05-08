// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { RecentActivityContent } from "@/components/school-dashboard/attendance/recent/content"

export const metadata = { title: "Dashboard: Recent Attendance Activity" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const { lang } = await params
  const session = await auth()

  // Recent activity is a staff dashboard, not a student/guardian view
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    redirect(`/${lang}/attendance`)
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
