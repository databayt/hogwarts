// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportCardTemplateContent } from "@/components/school-dashboard/grades/template"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function GradeTemplatePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ReportCardTemplateContent dictionary={dictionary} />
}
