import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function FeesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fees

  // Define fees page navigation
  const feesPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/fees` },
    { name: d?.navigation?.structure || 'Fee Structure', href: `/${lang}/finance/fees/structure` },
    { name: d?.navigation?.collection || 'Fee Collection', href: `/${lang}/finance/fees/collection` },
    { name: d?.navigation?.pending || 'Pending Fees', href: `/${lang}/finance/fees/pending` },
    { name: d?.navigation?.scholarships || 'Scholarships', href: `/${lang}/finance/fees/scholarships` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/fees/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Fees'}
        className="text-start max-w-none"
      />
      <PageNav pages={feesPages} />
      {children}
    </div>
  )
}