// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  const n = d?.navigation
  const timesheetPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/timesheet` },
    {
      name: n?.entry || "Time Entry",
      href: `/${lang}/finance/timesheet/entry`,
    },
    {
      name: n?.approval || "Approval",
      href: `/${lang}/finance/timesheet/approval`,
    },
    {
      name: n?.calendar || "Calendar View",
      href: `/${lang}/finance/timesheet/calendar`,
    },
    {
      name: n?.reports || "Reports",
      href: `/${lang}/finance/timesheet/reports`,
    },
    {
      name: n?.settings || "Settings",
      href: `/${lang}/finance/timesheet/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Timesheet"} />
      <PageNav pages={timesheetPages} />
      {children}
    </div>
  )
}
