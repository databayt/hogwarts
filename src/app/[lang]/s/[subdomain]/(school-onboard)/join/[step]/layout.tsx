"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useParams, usePathname, useRouter } from "next/navigation"

import {
  FormFooter,
  INTERNAL_ONBOARDING_CONFIG,
} from "@/components/form/footer"
import {
  useWizardValidation,
  WizardValidationProvider,
} from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"
import { OnboardingErrorBoundary } from "@/components/onboarding/error-boundary"

export default function StepLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingErrorBoundary>
      <WizardValidationProvider>
        {children}
        <StepFooter />
      </WizardValidationProvider>
    </OnboardingErrorBoundary>
  )
}

function StepFooter() {
  const { locale } = useLocale()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const steps = INTERNAL_ONBOARDING_CONFIG.steps

  const currentStep = pathname.split("/").pop()
  const stepIndex = steps.findIndex((s) => s === currentStep)

  const handleBack = () => {
    if (stepIndex > 0) {
      router.push(`/${locale}/s/${subdomain}/join/${steps[stepIndex - 1]}`)
    }
  }

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      router.push(`/${locale}/s/${subdomain}/join/${steps[stepIndex + 1]}`)
    }
  }

  return (
    <FormFooter
      config={INTERNAL_ONBOARDING_CONFIG}
      basePath={`/${locale}/s/${subdomain}/join`}
      onBack={handleBack}
      onNext={handleNext}
      showSave={false}
      showHelp={false}
      showLogo={true}
      finalLabel="Submit"
      finalDestination={`/${locale}/s/${subdomain}/join/welcome`}
      useValidation={useWizardValidation}
    />
  )
}
