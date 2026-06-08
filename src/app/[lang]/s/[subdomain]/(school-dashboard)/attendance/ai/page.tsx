// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AIContent } from "@/components/school-dashboard/attendance/ai/content"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"

export const metadata = { title: "Dashboard: AI Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang)

  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <AIContent locale={lang} />
}
