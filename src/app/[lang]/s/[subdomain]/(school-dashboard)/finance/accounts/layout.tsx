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

export default async function AccountsLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.accounts
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define accounts page navigation
  const n = d?.navigation
  const accountsPages: PageNavItem[] = !canView
    ? []
    : [
        { name: n?.overview || "Overview", href: `/${lang}/finance/accounts` },
        {
          name: n?.chart || "Chart of Accounts",
          href: `/${lang}/finance/accounts/chart`,
        },
        {
          name: n?.journal || "Journal Entries",
          href: `/${lang}/finance/accounts/journal`,
        },
        {
          name: n?.ledger || "General Ledger",
          href: `/${lang}/finance/accounts/ledger`,
        },
        {
          name: n?.reconciliation || "Reconciliation",
          href: `/${lang}/finance/accounts/reconciliation`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Accounts"} />
      <PageNav pages={accountsPages} />
      {children}
    </div>
  )
}
