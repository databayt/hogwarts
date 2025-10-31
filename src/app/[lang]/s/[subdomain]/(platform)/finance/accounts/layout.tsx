import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AccountsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.accounts

  // Define accounts page navigation
  const accountsPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/accounts` },
    { name: d?.navigation?.chartOfAccounts || 'Chart of Accounts', href: `/${lang}/finance/accounts/chart` },
    { name: d?.navigation?.journalEntries || 'Journal Entries', href: `/${lang}/finance/accounts/journal` },
    { name: d?.navigation?.generalLedger || 'General Ledger', href: `/${lang}/finance/accounts/ledger` },
    { name: d?.navigation?.reconciliation || 'Reconciliation', href: `/${lang}/finance/accounts/reconciliation` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/finance/accounts/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Accounts'}
        className="text-start max-w-none"
      />
      <PageNav pages={accountsPages} />
      {children}
    </div>
  )
}