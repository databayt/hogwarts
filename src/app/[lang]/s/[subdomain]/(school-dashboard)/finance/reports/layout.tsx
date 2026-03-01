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

export default async function ReportsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.reports

  // Define reports page navigation
  const n = d?.navigation
  const reportsPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/reports` },
    {
      name: n?.financial || "Financial Statements",
      href: `/${lang}/finance/reports/financial`,
    },
    {
      name: n?.cashFlow || "Cash Flow",
      href: `/${lang}/finance/reports/cashflow`,
    },
    {
      name: n?.profitLoss || "Profit & Loss",
      href: `/${lang}/finance/reports/profitloss`,
    },
    {
      name: n?.balanceSheet || "Balance Sheet",
      href: `/${lang}/finance/reports/balance-sheet`,
    },
    {
      name: n?.custom || "Custom Reports",
      href: `/${lang}/finance/reports/custom`,
    },
    {
      name: n?.schedule || "Schedule Reports",
      href: `/${lang}/finance/reports/schedule`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Reports"} />
      <PageNav pages={reportsPages} />
      {children}
    </div>
  )
}
