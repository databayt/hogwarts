import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function TimetableLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.timetable

  // Define timetable page navigation
  const timetablePages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/timetable` },
    { name: d?.navigation?.generate || 'Generate', href: `/${lang}/timetable/generate` },
    { name: d?.navigation?.conflicts || 'Conflicts', href: `/${lang}/timetable/conflicts` },
    { name: d?.navigation?.byClass || 'By Class', href: `/${lang}/timetable/by-class` },
    { name: d?.navigation?.byTeacher || 'By Teacher', href: `/${lang}/timetable/by-teacher` },
    { name: d?.navigation?.byRoom || 'By Room', href: `/${lang}/timetable/by-room` },
    { name: d?.navigation?.templates || 'Templates', href: `/${lang}/timetable/templates` },
    { name: d?.navigation?.analytics || 'Analytics', href: `/${lang}/timetable/analytics` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/timetable/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Timetable'}
        className="text-start max-w-none"
      />
      <PageNav pages={timetablePages} />
      {children}
    </div>
  )
}
