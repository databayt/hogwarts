// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigHolidaysForm } from "@/components/school-dashboard/school/configuration/config-holidays-form"
import { listHolidays } from "@/components/school-dashboard/school/configuration/holidays-actions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.holidays?.title ||
      "Configuration: Holidays",
  }
}

/** Holidays and closures — the school days with no classes. */
export default async function HolidaysPage({ params }: Props) {
  const { lang } = await params
  const result = await listHolidays()
  if (!result.success) redirect(`/${lang}/dashboard`)
  return <ConfigHolidaysForm initial={result.data} lang={lang} />
}
