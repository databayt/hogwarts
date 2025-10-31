import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function WalletLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.wallet

  // Define wallet page navigation
  const walletPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/wallet` },
    { name: d?.navigation?.balance || 'Balance', href: `/${lang}/finance/wallet/balance` },
    { name: d?.navigation?.transactions || 'Transactions', href: `/${lang}/finance/wallet/transactions` },
    { name: d?.navigation?.topUp || 'Top Up', href: `/${lang}/finance/wallet/top-up` },
    { name: d?.navigation?.withdraw || 'Withdraw', href: `/${lang}/finance/wallet/withdraw` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/wallet/reports` },
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