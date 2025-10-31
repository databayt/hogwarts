import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance

  // Define finance page navigation (primary links shown in nav, secondary hidden)
  const financePages: PageNavItem[] = [
    // Primary navigation (7 most important features)
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance` },
    { name: d?.navigation?.invoice || 'Invoice', href: `/${lang}/finance/invoice` },
    { name: d?.navigation?.banking || 'Banking', href: `/${lang}/finance/banking` },
    { name: d?.navigation?.fees || 'Fees', href: `/${lang}/finance/fees` },
    { name: d?.navigation?.salary || 'Salary', href: `/${lang}/finance/salary` },
    { name: d?.navigation?.payroll || 'Payroll', href: `/${lang}/finance/payroll` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/reports` },

    // Secondary navigation (hidden from nav, shown in content)
    { name: d?.navigation?.receipt || 'Receipt', href: `/${lang}/finance/receipt`, hidden: true },
    { name: d?.navigation?.timesheet || 'Timesheet', href: `/${lang}/finance/timesheet`, hidden: true },
    { name: d?.navigation?.wallet || 'Wallet', href: `/${lang}/finance/wallet`, hidden: true },
    { name: d?.navigation?.budget || 'Budget', href: `/${lang}/finance/budget`, hidden: true },
    { name: d?.navigation?.expenses || 'Expenses', href: `/${lang}/finance/expenses`, hidden: true },
    { name: d?.navigation?.accounts || 'Accounts', href: `/${lang}/finance/accounts`, hidden: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Finance'}
        className="text-start max-w-none"
      />
      <PageNav pages={financePages} />

      {children}
    </div>
  )
}
