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

export default async function PayrollLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.payroll
  const ps = dictionary?.finance?.payrollSettings
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Only routes that exist are listed. Processing / history / deductions /
  // benefits / reports have no page or component yet — their labels stay in the
  // dictionary (finance.payroll.navigation) for whenever they get built.
  const n = d?.navigation
  const payrollPages: PageNavItem[] = !canView
    ? []
    : [
        { name: n?.overview || "Overview", href: `/${lang}/finance/payroll` },
        {
          name: n?.runs || "Payroll Runs",
          href: `/${lang}/finance/payroll/runs`,
        },
        {
          name: ps?.title || "Payroll Settings",
          href: `/${lang}/finance/payroll/settings`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Payroll"} />
      <PageNav pages={payrollPages} />
      {children}
    </div>
  )
}
