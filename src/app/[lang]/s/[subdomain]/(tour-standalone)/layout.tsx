// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReportIssue } from "@/components/report-issue"

interface TourStandaloneLayoutProps {
  children: React.ReactNode
}

export default function TourStandaloneLayout({
  children,
}: Readonly<TourStandaloneLayoutProps>) {
  return (
    <main className="relative h-dvh">
      {children}
      <div className="text-muted-foreground absolute bottom-4 start-6 text-sm">
        <ReportIssue />
      </div>
    </main>
  )
}
