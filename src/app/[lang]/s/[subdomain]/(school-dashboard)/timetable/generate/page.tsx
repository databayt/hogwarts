// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GenerateTimetableContent from "@/components/school-dashboard/timetable/generate/content"
import {
  canModifyTimetable,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"

export const metadata = { title: "Dashboard: Generate Timetable" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  // Admin-only page: layout's PageNav hides the link for non-admins, but a
  // direct visit would still server-render the content (which then 500s
  // when its actions hit `requireAdminAccess`). Gate at the page boundary
  // and redirect to the locale root instead.
  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  if (!canModifyTimetable(role)) {
    redirect(`/${lang}`)
  }

  const dictionary = await getDictionary(lang)
  return <GenerateTimetableContent dictionary={dictionary.school} lang={lang} />
}
