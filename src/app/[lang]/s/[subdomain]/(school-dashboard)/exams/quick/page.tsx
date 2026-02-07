/**
 * Quick Assessments Page
 * Quick formative assessments (exit tickets, polls, warm-ups)
 */

import type { Locale } from "@/components/internationalization/config"
import { QuickAssessmentContent } from "@/components/school-dashboard/exams/quick/content"

interface QuickAssessmentsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function QuickAssessmentsPage({
  params,
}: QuickAssessmentsPageProps) {
  await params

  return <QuickAssessmentContent />
}
