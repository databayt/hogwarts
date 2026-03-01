// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// TODO: This page imports from classes/subjects/content (course sections),
// but it lives under the classrooms route (physical rooms). A dedicated
// classrooms-specific subjects component should be created that shows
// which subjects are taught in which physical rooms, rather than class-subject assignments.

import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ClassSubjectsContent from "@/components/school-dashboard/listings/classes/subjects/content"

export const metadata = { title: "Dashboard: Classroom Subjects" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <ClassSubjectsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
