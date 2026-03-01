// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TimetableContent } from "@/components/school-dashboard/timetable/content"
import {
  canModifyTimetable,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"

export const metadata = { title: "Dashboard: Timetable" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  const isAdmin = canModifyTimetable(role)

  return (
    <TimetableContent
      dictionary={dictionary.school}
      defaultTab={isAdmin ? undefined : "today"}
    />
  )
}
