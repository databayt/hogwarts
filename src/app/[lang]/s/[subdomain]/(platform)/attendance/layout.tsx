import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { TabsNav, type TabItem } from '@/components/atom/tabs'
import { getDictionary } from '@/components/internationalization/dictionaries'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AttendanceLayout({ children, params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)

  // Define attendance navigation tabs
  const tabs: TabItem[] = [
    {
      name: dictionary?.school?.attendance?.overview || 'Overview',
      href: `/${lang}/s/${subdomain}/attendance`,
      code: 'overview',
    },
    {
      name: dictionary?.school?.attendance?.settings || 'Settings',
      href: `/${lang}/s/${subdomain}/attendance/settings`,
      code: 'settings',
    },
    {
      name: dictionary?.school?.attendance?.analytics || 'Analytics',
      href: `/${lang}/s/${subdomain}/attendance/analytics`,
      code: 'analytics',
    },
    {
      name: dictionary?.school?.attendance?.reports || 'Reports',
      href: `/${lang}/s/${subdomain}/attendance/reports`,
      code: 'reports',
    },
    {
      name: dictionary?.school?.attendance?.recent || 'Recent',
      href: `/${lang}/s/${subdomain}/attendance/recent`,
      code: 'recent',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={dictionary?.school?.attendance?.title || 'Attendance'}
        variant="dashboard"
      />

      {/* Navigation Tabs */}
      <TabsNav tabs={tabs} className="mb-6" />

      {/* Page Content */}
      {children}
    </div>
  )
}
