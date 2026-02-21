"use client"

import React from "react"
import { useParams } from "next/navigation"

import {
  FormFooter,
  INTERNAL_ONBOARDING_CONFIG,
} from "@/components/form/footer"
import { WizardValidationProvider } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"

interface JoinLayoutProps {
  children: React.ReactNode
}

export default function JoinLayout({ children }: JoinLayoutProps) {
  const { locale } = useLocale()
  const params = useParams()
  const subdomain = params.subdomain as string

  return (
    <WizardValidationProvider>
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        {children}
      </div>
      <FormFooter
        config={INTERNAL_ONBOARDING_CONFIG}
        basePath={`/${locale}/s/${subdomain}/join`}
        idParam="step"
        showSave={false}
        showHelp={false}
        showLogo={true}
        finalLabel="Submit"
        finalDestination={`/${locale}/s/${subdomain}/join/welcome`}
      />
    </WizardValidationProvider>
  )
}
