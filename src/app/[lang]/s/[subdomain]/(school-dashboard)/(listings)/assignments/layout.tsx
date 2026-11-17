// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

/**
 * One page, role-based — no sub-tabs (the old "Upcoming" and "Submitted" tabs
 * pointed at routes that never existed). Each role's view groups its own
 * homework; this layout only names the page.
 */
export default async function AssignmentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.assignments

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title ?? ""} />
      {children}
    </div>
  )
}
