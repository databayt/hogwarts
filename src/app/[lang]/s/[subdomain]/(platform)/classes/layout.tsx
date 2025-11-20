import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ClassesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.classes

  // Define classes page navigation
  const classesPages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/classes` },
    { name: d?.navigation?.create || 'Create', href: `/${lang}/classes/create` },
    { name: d?.navigation?.subjects || 'Subjects', href: `/${lang}/classes/subjects` },
    { name: d?.navigation?.schedule || 'Schedule', href: `/${lang}/classes/schedule` },
    { name: d?.navigation?.capacity || 'Capacity', href: `/${lang}/classes/capacity` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/classes/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Classes'}
        className="text-start max-w-none"
      />
      <PageNav pages={classesPages} />
      {children}
    </div>
  )
}
