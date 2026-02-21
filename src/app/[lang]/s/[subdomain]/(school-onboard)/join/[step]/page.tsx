import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { INTERNAL_ONBOARDING_STEPS } from "@/components/internal-onboarding/config"
import { StepRenderer } from "@/components/internal-onboarding/steps"
import type { Locale } from "@/components/internationalization/config"

interface StepPageProps {
  params: Promise<{ lang: Locale; subdomain: string; step: string }>
}

export default async function StepPage({ params }: StepPageProps) {
  const { subdomain, step } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  // Validate step
  const validSteps: readonly string[] = INTERNAL_ONBOARDING_STEPS
  if (!validSteps.includes(step)) {
    notFound()
  }

  return (
    <StepRenderer step={step} schoolId={result.data.id} subdomain={subdomain} />
  )
}
