// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TimetableContent } from "@/components/school-dashboard/timetable/content"
import { loadInitialTimetable } from "@/components/school-dashboard/timetable/initial-data"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.timetable, b?.full].every(Boolean)
      ? [b?.timetable, b?.full].join(" - ")
      : "Dashboard: Timetable - Full Week",
  }
}

export default function Page() {
  return (
    <TimetableContent defaultTab="full" initialData={loadInitialTimetable()} />
  )
}
