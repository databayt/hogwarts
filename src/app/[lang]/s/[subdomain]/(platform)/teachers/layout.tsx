import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function TeachersLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.teachers

  // Define teachers page navigation (5 links - Add merged into All)
  const teachersPages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/teachers` },
    { name: d?.navigation?.departments || 'Departments', href: `/${lang}/teachers/departments` },
    { name: d?.navigation?.schedule || 'Schedule', href: `/${lang}/teachers/schedule` },
    { name: d?.navigation?.performance || 'Performance', href: `/${lang}/teachers/performance` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/teachers/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Teachers'}
      />
      <PageNav pages={teachersPages} />
      {children}
    </div>
  )
}
