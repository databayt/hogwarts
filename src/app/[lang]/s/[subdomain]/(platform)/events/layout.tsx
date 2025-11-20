import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function EventsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.events

  // Define events page navigation
  const eventsPages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/events` },
    { name: d?.navigation?.create || 'Create', href: `/${lang}/events/create` },
    { name: d?.navigation?.calendar || 'Calendar', href: `/${lang}/events/calendar` },
    { name: d?.navigation?.categories || 'Categories', href: `/${lang}/events/categories` },
    { name: d?.navigation?.attendance || 'Attendance', href: `/${lang}/events/attendance` },
    { name: d?.navigation?.recurring || 'Recurring', href: `/${lang}/events/recurring` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/events/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Events'}
        className="text-start max-w-none"
      />
      <PageNav pages={eventsPages} />
      {children}
    </div>
  )
}
