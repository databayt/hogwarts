// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SearchParams } from "nuqs/server"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import QuestionBankContent from "@/components/school-dashboard/exams/qbank/content"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<SearchParams>
}

export default async function QBankPage({ params, searchParams }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <QuestionBankContent
      searchParams={searchParams}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
