// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ChildTimetableView } from "@/components/school-dashboard/parent-portal/child-timetable-view"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildTimetablePage({ params }: Props) {
  const { id, lang } = await params
  const dictionary = await getDictionary(lang)
  return <ChildTimetableView studentId={id} dictionary={dictionary} />
}
