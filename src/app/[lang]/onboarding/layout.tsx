// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { LocaleDictionaryProvider } from "@/components/internationalization/locale-dictionary-provider"
import { ReportIssue } from "@/components/report-issue"

// Onboarding wizard uses session + dictionary lookup - always dynamic
export const dynamic = "force-dynamic"

interface OnboardingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function OnboardingLayout({
  children,
  params,
}: OnboardingLayoutProps) {
  const { lang } = await params
  // The dictionary reaches the flow through LocaleDictionaryProvider (a static,
  // cached client module), so this layout no longer loads or serializes one
  // into every step's document and Server Action response.

  return (
    <LocaleDictionaryProvider lang={lang}>
      <div className="flex min-h-screen flex-col">
        <main className="flex w-full flex-1 items-center px-4 sm:px-6 md:px-12 lg:px-20">
          {children}
        </main>
        <div className="text-muted-foreground px-6 pb-4 text-sm">
          <ReportIssue />
        </div>
      </div>
    </LocaleDictionaryProvider>
  )
}
