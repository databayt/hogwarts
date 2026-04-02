// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReportIssue } from "@/components/report-issue"

interface ApplicationLayoutProps {
  children: React.ReactNode
}

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex w-full flex-1 items-center px-4 sm:px-6 md:px-12 lg:px-20">
        {children}
      </main>
      <div className="text-muted-foreground px-6 pb-4 text-sm">
        <ReportIssue />
      </div>
    </div>
  )
}
