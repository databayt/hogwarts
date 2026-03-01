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

export default async function BudgetLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.budget

  // Define budget page navigation
  const n = d?.navigation
  const budgetPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/budget` },
    {
      name: n?.planning || "Budget Planning",
      href: `/${lang}/finance/budget/planning`,
    },
    {
      name: n?.tracking || "Budget Tracking",
      href: `/${lang}/finance/budget/tracking`,
    },
    {
      name: n?.variance || "Variance Analysis",
      href: `/${lang}/finance/budget/variance`,
    },
    {
      name: n?.forecasting || "Forecasting",
      href: `/${lang}/finance/budget/forecasting`,
    },
    {
      name: n?.approval || "Approval Workflow",
      href: `/${lang}/finance/budget/approval`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Budget"} />
      <PageNav pages={budgetPages} />
      {children}
    </div>
  )
}
