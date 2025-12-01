import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AnnouncementsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.announcements

  // Define announcements page navigation with i18n
  const announcementsPages: PageNavItem[] = [
    { name: d?.navAll || 'All', href: `/${lang}/announcements` },
    { name: d?.navPublished || 'Published', href: `/${lang}/announcements/published` },
    { name: d?.navDrafts || 'Drafts', href: `/${lang}/announcements/drafts` },
    { name: d?.navScheduled || 'Scheduled', href: `/${lang}/announcements/scheduled` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Announcements'}
      />
      <PageNav pages={announcementsPages} />
      {children}
    </div>
  )
}
