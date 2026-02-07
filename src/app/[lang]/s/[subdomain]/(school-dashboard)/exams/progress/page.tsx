/**
 * Progress Reports Page
 * Configure and manage automated progress report schedules
 */

import type { Locale } from "@/components/internationalization/config"
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
  await params

  return <ProgressReportContent />
}
