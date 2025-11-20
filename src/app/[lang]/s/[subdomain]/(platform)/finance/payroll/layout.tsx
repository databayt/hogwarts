import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function PayrollLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.payroll

  // Define payroll page navigation
  const payrollPages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/finance/payroll` },
    { name: 'Payroll Processing', href: `/${lang}/finance/payroll/processing` },
    { name: 'Payroll History', href: `/${lang}/finance/payroll/history` },
    { name: 'Deductions', href: `/${lang}/finance/payroll/deductions` },
    { name: 'Benefits', href: `/${lang}/finance/payroll/benefits` },
    { name: 'Reports', href: `/${lang}/finance/payroll/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Payroll'}
        className="text-start max-w-none"
      />
      <PageNav pages={payrollPages} />
      {children}
    </div>
  )
}