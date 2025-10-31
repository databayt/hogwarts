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
    { name: 'Overview', href: `/${lang}/finance/expenses` },
    { name: 'Submit Expense', href: `/${lang}/finance/expenses/submit` },
    { name: 'Pending Approval', href: `/${lang}/finance/expenses/pending` },
    { name: 'Approved', href: `/${lang}/finance/expenses/approved` },
    { name: 'Reports', href: `/${lang}/finance/expenses/reports` },
    { name: 'Categories', href: `/${lang}/finance/expenses/categories` },
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