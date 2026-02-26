// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ResultDetailContent from "@/components/school-dashboard/exams/results/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ExamResultDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <ResultDetailContent dictionary={dictionary} lang={lang} examId={id} />
}
