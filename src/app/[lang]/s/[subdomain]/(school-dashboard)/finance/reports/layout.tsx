// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { FINANCE_VIEW_ROLES } from "@/components/school-dashboard/finance/permissions"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ReportsLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.reports
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define reports page navigation
  const n = d?.navigation
  const reportsPages: PageNavItem[] = !canView
    ? []
    : [
        { name: n?.overview || "Overview", href: `/${lang}/finance/reports` },
        {
          name: n?.balanceSheet || "Balance Sheet",
          href: `/${lang}/finance/reports/balance-sheet`,
        },
        {
          name: n?.profitLoss || "Profit & Loss",
          href: `/${lang}/finance/reports/profit-loss`,
        },
        {
          name: n?.trialBalance || "Trial Balance",
          href: `/${lang}/finance/reports/trial-balance`,
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
