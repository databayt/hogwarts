// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { WelcomeStep } from "@/components/internal-onboarding/steps/welcome"
import type { Locale } from "@/components/internationalization/config"

interface WelcomePageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{
    ref?: string
    name?: string
    role?: string
    phone?: string
  }>
}

export default async function WelcomePage({
  params,
  searchParams,
}: WelcomePageProps) {
  const { subdomain } = await params
  const { ref, name, role, phone } = await searchParams
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <WelcomeStep
      schoolName={result.data.name}
      schoolPhone={result.data.phoneNumber}
      schoolEmail={result.data.email}
      subdomain={subdomain}
      refCode={ref}
      applicantName={name}
      applicantRole={role}
      applicantPhone={phone}
    />
  )
}
