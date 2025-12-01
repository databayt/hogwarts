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

  // Define attendance page navigation - WITHOUT subdomain (middleware handles it)
  const attendancePages: PageNavItem[] = [
    {
      name: dictionary?.school?.attendance?.overview || 'Overview',
      href: `/${lang}/attendance`,
    },
    {
      name: dictionary?.school?.attendance?.settings || 'Settings',
      href: `/${lang}/attendance/settings`,
    },
    {
      name: dictionary?.school?.attendance?.analytics || 'Analytics',
      href: `/${lang}/attendance/analytics`,
    },
    {
      name: dictionary?.school?.attendance?.reports || 'Reports',
      href: `/${lang}/attendance/reports`,
    },
    {
      name: dictionary?.school?.attendance?.recent || 'Recent',
      href: `/${lang}/attendance/recent`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={dictionary?.school?.attendance?.title || 'Attendance'}
      />
      <PageNav pages={attendancePages} />

      {children}
    </div>
  )
}
