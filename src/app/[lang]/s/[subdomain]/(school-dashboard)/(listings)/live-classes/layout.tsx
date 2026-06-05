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

export default async function LiveClassesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.liveClasses

  // Single "All" tab for now (the listing has one home).
  const liveClassesPages: PageNavItem[] = [
    { name: d?.navAll || "All", href: `/${lang}/live-classes` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Live Classes"} />
      <PageNav pages={liveClassesPages} />
      {children}
    </div>
  )
}
