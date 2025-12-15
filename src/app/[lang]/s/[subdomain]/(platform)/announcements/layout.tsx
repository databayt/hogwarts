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

  // Announcements page navigation (4 links)
  const announcementsPages: PageNavItem[] = [
    { name: d?.navAll || 'All', href: `/${lang}/announcements` },
    { name: 'Templates', href: `/${lang}/announcements/templates` },
    { name: d?.navArchived || 'Archive', href: `/${lang}/announcements/archived` },
    { name: 'Settings', href: `/${lang}/announcements/settings` },
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
