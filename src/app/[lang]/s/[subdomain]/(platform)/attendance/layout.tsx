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

  // MVP routes only - practical attendance management
  const attendancePages: PageNavItem[] = [
    {
      name: d?.overview || 'Overview',
      href: `/${lang}/s/${subdomain}/attendance`,
    },
    {
      name: d?.manual || 'Manual',
      href: `/${lang}/s/${subdomain}/attendance/manual`,
    },
    {
      name: 'QR Code',
      href: `/${lang}/s/${subdomain}/attendance/qr-code`,
    },
    {
      name: (d?.bulkUpload as { title?: string } | undefined)?.title || 'Bulk Upload',
      href: `/${lang}/s/${subdomain}/attendance/bulk-upload`,
    },
    {
      name: d?.reports || 'Reports',
      href: `/${lang}/s/${subdomain}/attendance/reports`,
    },
    {
      name: d?.settings || 'Settings',
      href: `/${lang}/s/${subdomain}/attendance/settings`,
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
