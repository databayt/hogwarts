// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolDisplayName } from "@/lib/school-name"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { OnboardingProvider } from "@/components/internal-onboarding/use-onboarding"
import type { Locale } from "@/components/internationalization/config"
import { ReportIssue } from "@/components/report-issue"
import ErrorBoundary from "@/components/school-marketing/application/error-boundary"

// Internal onboarding does per-tenant subdomain + DB lookup - always dynamic
export const dynamic = "force-dynamic"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; lang: string }>
}): Promise<Metadata> {
  const { subdomain, lang } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const name = getSchoolDisplayName(result.data, lang)
  return {
    title: name ? `Join ${name}` : "Join School",
  }
}

export default async function InternalOnboardingLayout({
  children,
  params,
}: LayoutProps) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    if (result.errorType === "db_error") {
      throw new Error("Database temporarily unavailable")
    }
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <ErrorBoundary>
          <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
            <OnboardingProvider schoolId={result.data.id} subdomain={subdomain}>
              {children}
            </OnboardingProvider>
          </div>
        </ErrorBoundary>
      </main>
      <div className="text-muted-foreground px-6 pb-4 text-sm">
        <ReportIssue />
      </div>
    </div>
  )
}
