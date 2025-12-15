import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function EventsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.events

  // Events page navigation (4 links - Create+Categories merged into All)
  const eventsPages: PageNavItem[] = [
    { name: d?.navigation?.all || 'All', href: `/${lang}/events` },
    { name: d?.navigation?.calendar || 'Calendar', href: `/${lang}/events/calendar` },
    { name: d?.navigation?.recurring || 'Recurring', href: `/${lang}/events/recurring` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/events/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Events'}
      />
      <PageNav pages={eventsPages} />
      {children}
    </div>
  )
}
