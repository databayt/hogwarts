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

export default async function ExpensesLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.expenses
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define expenses page navigation
  const n = d?.navigation
  const expensesPages: PageNavItem[] = !canView
    ? []
    : [
        { name: n?.overview || "Overview", href: `/${lang}/finance/expenses` },
        {
          name: n?.submit || "Submit Expense",
          href: `/${lang}/finance/expenses/submit`,
        },
        {
          name: n?.pending || "Pending Approval",
          href: `/${lang}/finance/expenses/pending`,
        },
        {
          name: n?.approved || "Approved",
          href: `/${lang}/finance/expenses/approved`,
        },
        {
          name: n?.reports || "Reports",
          href: `/${lang}/finance/expenses/reports`,
        },
        {
          name: n?.categories || "Categories",
          href: `/${lang}/finance/expenses/categories`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Expenses"} />
      <PageNav pages={expensesPages} />
      {children}
    </div>
  )
}
