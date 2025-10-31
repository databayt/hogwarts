import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ReportsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.reports

  // Define reports page navigation
  const reportsPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/reports` },
    { name: d?.navigation?.financial || 'Financial Statements', href: `/${lang}/finance/reports/financial` },
    { name: d?.navigation?.cashflow || 'Cash Flow', href: `/${lang}/finance/reports/cashflow` },
    { name: d?.navigation?.profitloss || 'Profit & Loss', href: `/${lang}/finance/reports/profitloss` },
    { name: d?.navigation?.balanceSheet || 'Balance Sheet', href: `/${lang}/finance/reports/balance-sheet` },
    { name: d?.navigation?.custom || 'Custom Reports', href: `/${lang}/finance/reports/custom` },
    { name: d?.navigation?.schedule || 'Schedule Reports', href: `/${lang}/finance/reports/schedule` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Reports'}
        className="text-start max-w-none"
      />
      <PageNav pages={reportsPages} />
      {children}
    </div>
  )
}