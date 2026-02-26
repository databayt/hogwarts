// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { INTERNAL_ONBOARDING_STEPS } from "@/components/internal-onboarding/config"
import { StepRenderer } from "@/components/internal-onboarding/steps"
import type { Locale } from "@/components/internationalization/config"

interface StepPageProps {
  params: Promise<{ lang: Locale; subdomain: string; step: string }>
}

export default async function StepPage({ params }: StepPageProps) {
  const { step } = await params

  const validSteps: readonly string[] = INTERNAL_ONBOARDING_STEPS
  if (!validSteps.includes(step)) {
    notFound()
  }

  return <StepRenderer step={step} />
}
