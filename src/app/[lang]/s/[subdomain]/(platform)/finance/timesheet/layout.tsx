import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TimesheetLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.timesheet

  // Define timesheet page navigation
  const timesheetPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance/timesheet` },
    { name: d?.navigation?.entry || 'Time Entry', href: `/${lang}/finance/timesheet/entry` },
    { name: d?.navigation?.approval || 'Approval', href: `/${lang}/finance/timesheet/approval` },
    { name: d?.navigation?.calendar || 'Calendar View', href: `/${lang}/finance/timesheet/calendar` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/finance/timesheet/reports` },
    { name: d?.navigation?.settings || 'Settings', href: `/${lang}/finance/timesheet/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Timesheet'}
        className="text-start max-w-none"
      />
      <PageNav pages={timesheetPages} />
      {children}
    </div>
  )
}