// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { OnboardingProvider } from "@/components/internal-onboarding/use-onboarding"
import type { Locale } from "@/components/internationalization/config"

interface JoinLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function JoinLayout({
  children,
  params,
}: JoinLayoutProps) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      <OnboardingProvider schoolId={result.data.id} subdomain={subdomain}>
        {children}
      </OnboardingProvider>
    </div>
  )
}
