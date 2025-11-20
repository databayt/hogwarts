import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

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
    { name: 'Overview', href: `/${lang}/finance/wallet` },
    { name: 'Balance', href: `/${lang}/finance/wallet/balance` },
    { name: 'Transactions', href: `/${lang}/finance/wallet/transactions` },
    { name: 'Top Up', href: `/${lang}/finance/wallet/top-up` },
    { name: 'Withdraw', href: `/${lang}/finance/wallet/withdraw` },
    { name: 'Reports', href: `/${lang}/finance/wallet/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Wallet'}
        className="text-start max-w-none"
      />
      <PageNav pages={walletPages} />
      {children}
    </div>
  )
}