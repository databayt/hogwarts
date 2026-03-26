// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick Assessment Take Page
 * Student-facing page for taking a quick assessment
 */

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { QuickAssessmentTake } from "@/components/school-dashboard/exams/quick/take"

interface TakePageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
    id: string
  }>
}

export default async function QuickAssessmentTakePage({
  params,
}: TakePageProps) {
  const { id } = await params
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <QuickAssessmentTake assessmentId={id} />
}
