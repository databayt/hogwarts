// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TimetableContent } from "@/components/school-dashboard/timetable/content"
import { loadInitialTimetable } from "@/components/school-dashboard/timetable/initial-data"
import {
  canModifyTimetable,
  rendersStudentTimetable,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: b?.timetable || "Dashboard: Timetable",
  }
}

export default async function Page() {
  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  const isAdmin = canModifyTimetable(role)

  return (
    <TimetableContent
      defaultTab={isAdmin ? undefined : "today"}
      // The role is known here and nowhere else until two server actions have
      // answered inside the client tree — which is the entire wait the loading
      // placeholder covers. Handing it down lets that placeholder be the right
      // shape from the server render on, rather than a week grid in front of a
      // phone that is about to show one day.
      studentShell={rendersStudentTimetable(role)}
      initialData={loadInitialTimetable()}
    />
  )
}
