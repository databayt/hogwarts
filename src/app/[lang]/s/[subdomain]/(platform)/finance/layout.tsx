import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.settings // Finance uses settings dictionary for now

  // Finance page navigation (6 links)
  const financePages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/finance` },
    { name: 'Fees', href: `/${lang}/finance/fees` },
    { name: 'Invoice', href: `/${lang}/finance/invoice` },
    { name: 'Banking', href: `/${lang}/finance/banking` },
    { name: 'Salary', href: `/${lang}/finance/salary` },
    { name: 'Reports', href: `/${lang}/finance/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Finance'}
      />
      <PageNav pages={financePages} />
      {children}
    </div>
  )
}
