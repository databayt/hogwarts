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
  const walletPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/wallet` },
    { name: "Balance", href: `/${lang}/finance/wallet/balance` },
    { name: "Transactions", href: `/${lang}/finance/wallet/transactions` },
    { name: "Top Up", href: `/${lang}/finance/wallet/top-up` },
    { name: "Withdraw", href: `/${lang}/finance/wallet/withdraw` },
    { name: "Reports", href: `/${lang}/finance/wallet/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Wallet"} />
      <PageNav pages={walletPages} />
      {children}
    </div>
  )
}
