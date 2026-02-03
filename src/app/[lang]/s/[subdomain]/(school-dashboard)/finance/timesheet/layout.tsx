import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function TimesheetLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.timesheet

  // Define timesheet page navigation
  const timesheetPages: PageNavItem[] = [
    { name: "Overview", href: `/${lang}/finance/timesheet` },
    { name: "Time Entry", href: `/${lang}/finance/timesheet/entry` },
    { name: "Approval", href: `/${lang}/finance/timesheet/approval` },
    { name: "Calendar View", href: `/${lang}/finance/timesheet/calendar` },
    { name: "Reports", href: `/${lang}/finance/timesheet/reports` },
    { name: "Settings", href: `/${lang}/finance/timesheet/settings` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Timesheet"} />
      <PageNav pages={timesheetPages} />
      {children}
    </div>
  )
}
