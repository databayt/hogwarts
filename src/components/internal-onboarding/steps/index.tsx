"use client"

import React from "react"

import { OnboardingProvider } from "../use-onboarding"
import { ContactStep } from "./contact"
import { DocumentsStep } from "./documents"
import { PersonalStep } from "./personal"
import { ReviewStep } from "./review"
import { RoleDetailsStep } from "./role-details"

export { PersonalStep } from "./personal"
export { ContactStep } from "./contact"
export { RoleDetailsStep } from "./role-details"
export { DocumentsStep } from "./documents"
export { ReviewStep } from "./review"
export { WelcomeStep } from "./welcome"

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  personal: PersonalStep,
  contact: ContactStep,
  "role-details": RoleDetailsStep,
  documents: DocumentsStep,
  review: ReviewStep,
}

interface StepRendererProps {
  step: string
  schoolId: string
  subdomain: string
}

export function StepRenderer({ step, schoolId, subdomain }: StepRendererProps) {
  const Component = STEP_COMPONENTS[step]
  if (!Component) return null

  return (
    <OnboardingProvider schoolId={schoolId} subdomain={subdomain}>
      <Component />
    </OnboardingProvider>
  )
}
