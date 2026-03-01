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

export default async function AssignmentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.assignments

  // Define assignments page navigation
  const assignmentsPages: PageNavItem[] = [
    { name: d?.navAll || "All", href: `/${lang}/assignments` },
    {
      name: d?.navUpcoming || "Upcoming",
      href: `/${lang}/assignments/upcoming`,
    },
    {
      name: d?.navSubmitted || "Submitted",
      href: `/${lang}/assignments/submitted`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Assignments"} />
      <PageNav pages={assignmentsPages} />
      {children}
    </div>
  )
}
