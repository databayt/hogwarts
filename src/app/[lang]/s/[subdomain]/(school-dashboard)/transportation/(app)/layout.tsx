// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReactNode } from "react"

import { TransportationSectionNav } from "@/components/school-dashboard/transportation/nav"

interface Props {
  children: ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

/**
 * Chrome for the transportation ops surfaces — dashboard, vehicles, routes,
 * drivers, assignments, trips, reports, fees, settings. A route group, so it
 * adds the heading + tab strip without adding a URL segment: these live at
 * /transportation/<name>, not /transportation/app/<name>.
 *
 * The landing page (/transportation) and the guardian/student view
 * (/transportation/me) sit outside this group on purpose — the landing page
 * owns its own hero, and /me is an end-user page, not ops chrome.
 */
export default async function TransportationAppLayout({
  children,
  params,
}: Props) {
  const { lang } = await params

  return (
    <div className="space-y-6">
      <TransportationSectionNav lang={lang} />
      {children}
    </div>
  )
}
