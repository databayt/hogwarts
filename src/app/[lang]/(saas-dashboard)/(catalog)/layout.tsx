// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getCatalogPendingCounts } from "@/components/saas-dashboard/catalog/pending-counts"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function CatalogLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const n = dictionary?.saas?.catalog?.navigation

  // Pending counts for the tab badges. Shared with the outer dashboard layout
  // (which badges the sidebar) — React cache() dedupes them per request.
  const { totalApprovalsPending: pendingCount, proposalPending } =
    await getCatalogPendingCounts()

  const approvalsLabel = n?.approvals || "Approvals"
  const proposalsLabel = n?.proposals || "Proposals"

  const catalogPages: PageNavItem[] = [
    { name: n?.subjects || "Subjects", href: `/${lang}/catalog` },
    { name: n?.questions || "Questions", href: `/${lang}/catalog/questions` },
    { name: n?.materials || "Materials", href: `/${lang}/catalog/materials` },
    {
      name: n?.assignments || "Assignments",
      href: `/${lang}/catalog/assignments`,
    },
    { name: n?.books || "Books", href: `/${lang}/catalog/books` },
    {
      name:
        pendingCount > 0
          ? `${approvalsLabel} (${pendingCount})`
          : approvalsLabel,
      href: `/${lang}/catalog/approvals`,
    },
    {
      name:
        proposalPending > 0
          ? `${proposalsLabel} (${proposalPending})`
          : proposalsLabel,
      href: `/${lang}/catalog/proposals`,
    },
    { name: n?.analytics || "Analytics", href: `/${lang}/catalog/analytics` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={n?.catalog || "Catalog"} />
      <PageNav pages={catalogPages} />
      {children}
    </div>
  )
}
