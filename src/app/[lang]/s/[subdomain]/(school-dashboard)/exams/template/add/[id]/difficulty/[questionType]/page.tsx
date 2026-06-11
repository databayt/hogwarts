// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import { getExamDictionary } from "@/components/internationalization/dictionaries"
import DifficultyContent from "@/components/school-dashboard/exams/wizard/template-wizard/difficulty/content"

interface Props {
  params: Promise<{
    lang: Locale
    subdomain: string
    id: string
    questionType: string
  }>
}

export default async function DifficultyPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getExamDictionary(lang)
  return (
    <DifficultyContent
      dictionary={dictionary.generate.wizard.steps.difficulty}
    />
  )
}
