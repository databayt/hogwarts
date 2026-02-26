// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GradesContent from "@/components/school-dashboard/listings/grades/content"

export const metadata = { title: "Dashboard: Grades" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <GradesContent
      searchParams={searchParams}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
