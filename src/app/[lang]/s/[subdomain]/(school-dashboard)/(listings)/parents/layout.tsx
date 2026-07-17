// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ParentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.parents

  // Parents page navigation. Only routes that exist are linked — the
  // Link / Communication / Settings pages were never built, so linking them
  // fell through to /parents/[id] and rendered a 404 (issue #378).
  const parentsPages: PageNavItem[] = [
    { name: d?.allParents || "All", href: `/${lang}/parents` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Parents"} />
      {parentsPages.length > 1 && <PageNav pages={parentsPages} />}
      {children}
    </div>
  )
}
