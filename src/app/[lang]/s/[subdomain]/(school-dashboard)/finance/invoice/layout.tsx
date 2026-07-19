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

export default async function InvoiceLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const d = dictionary?.finance?.invoice
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define invoice page navigation
  const n = d?.navigation
  const invoicePages: PageNavItem[] = !canView
    ? []
    : [
        {
          name: n?.all || "All",
          href: `/${lang}/finance/invoice`,
          exact: true,
        },
        {
          name: n?.analysis || "Analysis",
          href: `/${lang}/finance/invoice/analysis`,
        },
        {
          name: n?.createNew || "Create Invoice",
          href: `/${lang}/finance/invoice/invoice/create`,
        },
        {
          name: n?.settings || "Settings",
          href: `/${lang}/finance/invoice/settings`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Invoice"} />
      {/* print:hidden — the invoice detail prints as a bare document sheet */}
      <div className="print:hidden">
        <PageNav pages={invoicePages} />
      </div>
      {children}
    </div>
  )
}
