// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReactNode } from "react"

import { ConferenceSectionNav } from "@/components/school-dashboard/conference/nav"

interface Props {
  children: ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

/**
 * Chrome for the managed conference surfaces — sessions, schedule, settings,
 * network test. A route group, so it adds the heading + tab strip without
 * adding a URL segment: these stay at `/conference/<name>`.
 *
 * The landing page (`/conference`) and a single session (`/conference/[id]`)
 * sit outside this group on purpose — the landing owns its own hero, and the
 * session detail page is a leaf reached from a row, not a tab.
 */
export default async function ConferenceAppLayout({ children, params }: Props) {
  const { lang } = await params

  return (
    <div className="space-y-6">
      <ConferenceSectionNav lang={lang} />
      {children}
    </div>
  )
}
