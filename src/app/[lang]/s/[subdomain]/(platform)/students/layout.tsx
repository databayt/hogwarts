import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function StudentsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.students

  // Define students page navigation
  const studentsPages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/students` },
    { name: d?.navigation?.enroll || 'Enroll', href: `/${lang}/students/enroll` },
    { name: d?.navigation?.yearLevels || 'Year Levels', href: `/${lang}/students/year-levels` },
    { name: d?.navigation?.guardians || 'Guardians', href: `/${lang}/students/guardians` },
    { name: d?.navigation?.performance || 'Performance', href: `/${lang}/students/performance` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/students/reports` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/students/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Students'}
        className="text-start max-w-none"
      />
      <PageNav pages={studentsPages} />
      {children}
    </div>
  )
}
