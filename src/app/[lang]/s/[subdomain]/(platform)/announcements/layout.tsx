import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AnnouncementsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.announcements

  // Define announcements page navigation
  const announcementsPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/announcements` },
    // Future navigation items can be added here:
    // { name: d?.navigation?.drafts || 'Drafts', href: `/${lang}/announcements/drafts`, hidden: true },
    // { name: d?.navigation?.scheduled || 'Scheduled', href: `/${lang}/announcements/scheduled`, hidden: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Announcements'}
        className="text-start max-w-none"
      />
      <PageNav pages={announcementsPages} />
      {children}
    </div>
  )
}
