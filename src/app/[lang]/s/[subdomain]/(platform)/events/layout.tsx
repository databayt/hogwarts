import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function EventsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.events

  // Define events page navigation
  const eventsPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/events` },
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
