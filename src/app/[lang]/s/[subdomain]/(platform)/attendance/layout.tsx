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

  const basePath = `/${lang}/s/${subdomain}/attendance`

  const attendancePages: PageNavItem[] = [
    {
      name: d?.overview || 'Overview',
      href: basePath,
    },
    {
      name: d?.settings || 'Config',
      href: `${basePath}/config`,
    },
    {
      name: 'Bulk',
      href: `${basePath}/bulk`,
    },
    {
      name: d?.reports || 'Report',
      href: `${basePath}/reports`,
    },
    {
      name: d?.analytics || 'Analysis',
      href: `${basePath}/analysis`,
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
