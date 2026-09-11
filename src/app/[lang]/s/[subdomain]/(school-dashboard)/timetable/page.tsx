// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TimetableContent } from "@/components/school-dashboard/timetable/content"
import {
  canModifyTimetable,
  rendersStudentTimetable,
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
      // The role is known here and nowhere else until two server actions have
      // answered inside the client tree — which is the entire wait the loading
      // placeholder covers. Handing it down lets that placeholder be the right
      // shape from the server render on, rather than a week grid in front of a
      // phone that is about to show one day.
      studentShell={rendersStudentTimetable(role)}
    />
  )
}
