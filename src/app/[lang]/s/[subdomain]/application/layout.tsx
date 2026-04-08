// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { ReportIssue } from "@/components/report-issue"

interface ApplicationLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function ApplicationLayout({
  children,
  params,
}: ApplicationLayoutProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)

  return (
    <DictionaryProvider dictionary={dictionary}>
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
