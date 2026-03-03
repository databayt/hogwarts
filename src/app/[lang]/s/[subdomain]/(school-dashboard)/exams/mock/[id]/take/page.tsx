// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getCatalogExamForTaking } from "@/components/school-dashboard/exams/mock/take-actions"
import { MockExamTaking } from "@/components/school-dashboard/exams/mock/take-content"

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function MockExamTakePage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  const result = await getCatalogExamForTaking(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <MockExamTaking exam={result.data} dictionary={dictionary} />
}
