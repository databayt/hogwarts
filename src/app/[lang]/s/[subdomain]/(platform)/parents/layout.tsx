import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ParentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.parents

  // Define parents page navigation
  const parentsPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/parents` },
    // Future navigation items can be added here:
    // { name: d?.navigation?.active || 'Active', href: `/${lang}/parents/active`, hidden: true },
    // { name: d?.navigation?.inactive || 'Inactive', href: `/${lang}/parents/inactive`, hidden: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Parents'}
        className="text-start max-w-none"
      />
      <PageNav pages={parentsPages} />
      {children}
    </div>
  )
}
