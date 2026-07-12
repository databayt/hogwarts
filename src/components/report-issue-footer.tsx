"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { usePathname } from "next/navigation"

import { ReportIssue } from "@/components/report-issue"

/**
 * Dashboard-wide ReportIssue footer.
 * Hidden on configuration editor routes — those pages render their own
 * ReportIssue at the bottom of each step's content column instead of
 * letting it visually anchor under the cards sidebar.
 */
export function ReportIssueFooter() {
  const pathname = usePathname()

  if (pathname?.includes("/school/configuration/")) return null

  return (
    <div className="text-muted-foreground pt-8 pb-4 text-start text-sm print:hidden">
      <ReportIssue />
    </div>
  )
}
