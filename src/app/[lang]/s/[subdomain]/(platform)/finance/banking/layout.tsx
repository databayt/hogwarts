import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

interface BankingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function BankingLayout({
  children,
  params,
}: Readonly<BankingLayoutProps>) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang as Locale)

  // Define banking page navigation
  const bankingPages: PageNavItem[] = [
    { name: dictionary?.banking?.dashboard || 'Dashboard', href: `/${lang}/finance/banking` },
    { name: dictionary?.banking?.myBanks || 'My Banks', href: `/${lang}/finance/banking/my-banks` },
    { name: dictionary?.banking?.paymentTransfer || 'Payment Transfer', href: `/${lang}/finance/banking/payment-transfer` },
    { name: dictionary?.banking?.transactionHistory || 'Transaction History', href: `/${lang}/finance/banking/transaction-history` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title="Banking"
      />
      <PageNav pages={bankingPages} />

      {children}
    </div>
  )
}