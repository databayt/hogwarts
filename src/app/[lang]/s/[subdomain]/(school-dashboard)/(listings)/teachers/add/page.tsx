// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AddTeacherContent from "@/components/school-dashboard/listings/teachers/add/content"

export const metadata = { title: "Dashboard: Add Teacher" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <AddTeacherContent dictionary={dictionary.school} lang={lang} />
}
