// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableSettingsContent from "@/components/school-dashboard/timetable/settings/content"

export const metadata = { title: "Dashboard: Timetable Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TimetableSettingsContent dictionary={dictionary.school} lang={lang} />
}
