import { type Locale } from '@/components/internationalization/config'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
import { getDictionary } from '@/components/internationalization/dictionaries'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AttendanceLayout({ children, params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.attendance

  const attendancePages: PageNavItem[] = [
    {
      name: 'Overview',
      href: `/${lang}/s/${subdomain}/attendance`,
    },
    {
      name: 'Bulk',
      href: `/${lang}/s/${subdomain}/attendance/bulk`,
    },
    {
      name: 'Report',
      href: `/${lang}/s/${subdomain}/attendance/reports`,
    },
    {
      name: 'Settings',
      href: `/${lang}/s/${subdomain}/attendance/config`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Attendance'}
      />
      <PageNav pages={attendancePages} />

      {children}
    </div>
  )
}
