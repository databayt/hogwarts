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

export default async function SubjectsBrowseLayout({
  children,
  params,
}: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.subjects

  const n = d?.navigation
  const subjectsPages: PageNavItem[] = [
    { name: n?.all || "All", href: `/${lang}/subjects` },
    {
      name: n?.elementary || "Elementary",
      href: `/${lang}/subjects/elementary`,
    },
    { name: n?.middle || "Middle", href: `/${lang}/subjects/middle` },
    { name: n?.high || "High", href: `/${lang}/subjects/high` },
    { name: n?.catalog || "Catalog", href: `/${lang}/subjects/catalog` },
    {
      name: n?.contribute || "Contribute",
      href: `/${lang}/subjects/contribute`,
    },
    {
      name: n?.myContributions || "My Contributions",
      href: `/${lang}/subjects/contributions`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Subjects"} />
      <PageNav pages={subjectsPages} />
      {children}
    </div>
  )
}
