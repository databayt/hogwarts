import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ExpensesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.expenses

  // Define expenses page navigation
  const expensesPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/expenses` },
    { name: d?.navigation?.submit || 'Submit Expense', href: `/${lang}/finance/expenses/submit` },
    { name: d?.navigation?.pending || 'Pending Approval', href: `/${lang}/finance/expenses/pending` },
    { name: d?.navigation?.approved || 'Approved', href: `/${lang}/finance/expenses/approved` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/expenses/reports` },
    { name: d?.navigation?.categories || 'Categories', href: `/${lang}/finance/expenses/categories` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Expenses'}
        className="text-start max-w-none"
      />
      <PageNav pages={expensesPages} />
      {children}
    </div>
  )
}