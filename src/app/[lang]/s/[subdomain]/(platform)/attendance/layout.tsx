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
      name: d?.overview || 'Overview',
      href: `/${lang}/s/${subdomain}/attendance`,
    },
    {
      name: d?.manual || 'Manual',
      href: `/${lang}/s/${subdomain}/attendance/manual`,
    },
    {
      name: d?.qrCode || 'QR Code',
      href: `/${lang}/s/${subdomain}/attendance/qrcode`,
    },
    {
      name: d?.bulk || 'Bulk',
      href: `/${lang}/s/${subdomain}/attendance/bulk`,
    },
    {
      name: d?.advance || 'Advance',
      href: `/${lang}/s/${subdomain}/attendance/advance`,
    },
    {
      name: d?.config || 'Config',
      href: `/${lang}/s/${subdomain}/attendance/config`,
    },
    {
      name: d?.report || 'Report',
      href: `/${lang}/s/${subdomain}/attendance/report`,
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
