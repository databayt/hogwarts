// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { FINANCE_VIEW_ROLES } from "@/components/school-dashboard/finance/permissions"

interface BankingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function BankingLayout({
  children,
  params,
}: Readonly<BankingLayoutProps>) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang as Locale)
  const role = (session?.user?.role ?? null) as Role | null
  const bp = (dictionary as any)?.finance?.bankingPage as
    | Record<string, string>
    | undefined
  const canView = isRoleIn(role, FINANCE_VIEW_ROLES)

  // Define banking page navigation
  const bankingPages: PageNavItem[] = !canView
    ? []
    : [
        {
          name: bp?.dashboard || "Dashboard",
          href: `/${lang}/finance/banking`,
        },
        {
          name: bp?.myBanks || "My Banks",
          href: `/${lang}/finance/banking/my-banks`,
        },
        {
          name: bp?.paymentTransfer || "Payment Transfer",
          href: `/${lang}/finance/banking/payment-transfer`,
        },
        {
          name: bp?.transactionHistory || "Transaction History",
          href: `/${lang}/finance/banking/transaction-history`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={bp?.title || "Banking"} />
      <PageNav pages={bankingPages} />

      {children}
    </div>
  )
}
