// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Progress Reports Page
 * Configure and manage automated progress report schedules
 */

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ProgressReportContent } from "@/components/school-dashboard/exams/progress/content"

interface ProgressReportsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ProgressReportsPage({
  params,
}: ProgressReportsPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ProgressReportContent />
}
