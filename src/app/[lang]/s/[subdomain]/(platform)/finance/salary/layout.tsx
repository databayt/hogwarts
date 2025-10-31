import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function SalaryLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.salary

  // Define salary page navigation
  const salaryPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/salary` },
    { name: d?.navigation?.structure || 'Salary Structure', href: `/${lang}/finance/salary/structure` },
    { name: d?.navigation?.slips || 'Salary Slips', href: `/${lang}/finance/salary/slips` },
    { name: d?.navigation?.increments || 'Increments', href: `/${lang}/finance/salary/increments` },
    { name: d?.navigation?.advances || 'Advances', href: `/${lang}/finance/salary/advances` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/salary/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Salary'}
        className="text-start max-w-none"
      />
      <PageNav pages={salaryPages} />
      {children}
    </div>
  )
}