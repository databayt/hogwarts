"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import PageHeading from "@/components/atom/page-heading"

import { usePageHeading } from "./page-heading-context"

export function PageHeadingDisplay() {
  const { heading } = usePageHeading()

  if (!heading || !heading.title) return null

  return (
    // print:hidden — app chrome; printed pages (invoice sheet, admission
    // detail, timetable) carry their own document headers.
    <div className="mb-6 print:hidden">
      <PageHeading title={heading.title} description={heading.description} />
    </div>
  )
}
