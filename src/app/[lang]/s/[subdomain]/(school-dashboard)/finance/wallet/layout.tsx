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

export default async function WalletLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.wallet

  // Define wallet page navigation
  const n = d?.navigation
  const walletPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/wallet` },
    { name: n?.balance || "Balance", href: `/${lang}/finance/wallet/balance` },
    {
      name: n?.transactions || "Transactions",
      href: `/${lang}/finance/wallet/transactions`,
    },
    { name: n?.topUp || "Top Up", href: `/${lang}/finance/wallet/top-up` },
    {
      name: n?.withdraw || "Withdraw",
      href: `/${lang}/finance/wallet/withdraw`,
    },
    { name: n?.reports || "Reports", href: `/${lang}/finance/wallet/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Wallet"} />
      <PageNav pages={walletPages} />
      {children}
    </div>
  )
}
