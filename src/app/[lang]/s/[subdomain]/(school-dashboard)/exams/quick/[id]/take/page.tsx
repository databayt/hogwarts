/**
 * Quick Assessment Take Page
 * Student-facing page for taking a quick assessment
 */

import type { Locale } from "@/components/internationalization/config"
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

  return <QuickAssessmentTake assessmentId={id} />
}
