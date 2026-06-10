// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import {
  getPlatformCoreDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { ReportIssue } from "@/components/report-issue"

// Application flow uses cookies + dictionary lookup - always dynamic
export const dynamic = "force-dynamic"

interface ApplicationLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ApplicationLayout({
  children,
  params,
}: ApplicationLayoutProps) {
  const { lang } = await params
  // Route-scoped: the application/admission flow only consumes core
  // general/school keys plus the `messages` namespace (form validation helpers).
  // The other feature namespaces + stream are never accessed here, so the
  // narrower getPlatformCoreDictionary (core + messages) payload is safe.
  const dictionary = await getPlatformCoreDictionary(lang as Locale)

  return (
    <DictionaryProvider dictionary={dictionary as Dictionary}>
      <div className="flex min-h-screen flex-col">
        <main className="flex w-full flex-1 items-center px-4 sm:px-6 md:px-12 lg:px-20">
          {children}
        </main>
        <div className="text-muted-foreground px-6 pb-4 text-sm">
          <ReportIssue />
        </div>
      </div>
    </DictionaryProvider>
  )
}
