// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
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

  const { schoolId } = await getTenantContext()

  // Query school's academic levels to determine which tabs to show
  let levelSet = new Set<string>()
  if (schoolId) {
    try {
      const levels = await db.academicLevel.findMany({
        where: { schoolId },
        select: { level: true },
      })
      levelSet = new Set(levels.map((l) => l.level))
    } catch {
      // Fallback: show all tabs if query fails
    }
  }

  // Only show level tabs when school has 2+ levels (single level = "All" is identical)
  const showLevelTabs = levelSet.size >= 2

  const n = d?.navigation
  const subjectsPages: PageNavItem[] = [
    { name: n?.all || "All", href: `/${lang}/subjects` },
    {
      name: n?.elementary || "Elementary",
      href: `/${lang}/subjects/elementary`,
      hidden: !showLevelTabs || !levelSet.has("ELEMENTARY"),
    },
    {
      name: n?.middle || "Middle",
      href: `/${lang}/subjects/middle`,
      hidden: !showLevelTabs || !levelSet.has("MIDDLE"),
    },
    {
      name: n?.high || "High",
      href: `/${lang}/subjects/high`,
      hidden: !showLevelTabs || !levelSet.has("HIGH"),
    },
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
