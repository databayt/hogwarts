// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TemplatesContent } from "@/components/school-dashboard/timetable/templates/content"

export const metadata = { title: "Dashboard: Timetable Templates" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // TODO: Get termId from active term context
  const termId = ""

  return <TemplatesContent dictionary={dictionary.school} termId={termId} />
}
