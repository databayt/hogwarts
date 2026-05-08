// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableConflictsContent from "@/components/school-dashboard/timetable/conflicts/content"
import {
  canManageConflicts,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"

export const metadata = { title: "Dashboard: Timetable Conflicts" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params

  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  if (!canManageConflicts(role)) {
    redirect(`/${lang}`)
  }

  const dictionary = await getDictionary(lang)
  return (
    <TimetableConflictsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
