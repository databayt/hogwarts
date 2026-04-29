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

export default async function BudgetLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.budget
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define budget page navigation
  const n = d?.navigation
  const budgetPages: PageNavItem[] = !canView
    ? []
    : [
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
