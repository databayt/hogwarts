// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  canModifyTimetable,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"
import { TemplatesContent } from "@/components/school-dashboard/timetable/templates/content"

export const metadata = { title: "Dashboard: Timetable Templates" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  if (!canModifyTimetable(role)) {
    redirect(`/${lang}`)
  }

  const dictionary = await getDictionary(lang)

  // TODO: Get termId from active term context
  const termId = ""

  return <TemplatesContent dictionary={dictionary.school} termId={termId} />
}
