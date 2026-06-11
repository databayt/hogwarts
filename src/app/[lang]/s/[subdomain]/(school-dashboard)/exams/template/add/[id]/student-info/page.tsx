// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import { getExamDictionary } from "@/components/internationalization/dictionaries"
import StudentInfoContent from "@/components/school-dashboard/exams/wizard/template-wizard/student-info/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StudentInfoPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getExamDictionary(lang)
  return (
    <StudentInfoContent
      dictionary={dictionary.generate.wizard.steps.studentInfo}
    />
  )
}
