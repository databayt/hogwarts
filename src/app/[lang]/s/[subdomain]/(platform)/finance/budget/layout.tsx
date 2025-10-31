import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BudgetLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.budget

  // Define budget page navigation
  const budgetPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/budget` },
    { name: d?.navigation?.planning || 'Budget Planning', href: `/${lang}/finance/budget/planning` },
    { name: d?.navigation?.tracking || 'Budget Tracking', href: `/${lang}/finance/budget/tracking` },
    { name: d?.navigation?.variance || 'Variance Analysis', href: `/${lang}/finance/budget/variance` },
    { name: d?.navigation?.forecasting || 'Forecasting', href: `/${lang}/finance/budget/forecasting` },
    { name: d?.navigation?.approval || 'Approval Workflow', href: `/${lang}/finance/budget/approval` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Budget'}
        className="text-start max-w-none"
      />
      <PageNav pages={budgetPages} />
      {children}
    </div>
  )
}