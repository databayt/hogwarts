// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { UsersAnalysis } from "@/components/saas-dashboard/users/analysis"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "User Analysis",
  description: "Analytics and statistics for platform users",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function UserAnalysisPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const usersPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/users` },
    { name: n?.analytics || "Analysis", href: `/${lang}/users/analysis` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Users" />
      <PageNav pages={usersPages} />
      <UsersAnalysis />
    </div>
  )
}
