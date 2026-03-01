// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import {
  canConfigureSettings,
  canManageConflicts,
  canModifyTimetable,
  hasPermission,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function TimetableLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.timetable

  const session = await auth()
  const role = (session?.user?.role as TimetableRole) || null
  const isAdmin = canModifyTimetable(role)

  const timetablePages: PageNavItem[] = [
    // Admin tabs
    {
      name: d?.navigation?.all || "Overview",
      href: `/${lang}/timetable`,
      hidden: !isAdmin,
    },
    {
      name: d?.navigation?.analytics || "Analytics",
      href: `/${lang}/timetable/analytics`,
      hidden: !hasPermission(role, "view_analytics"),
    },
    {
      name: d?.navigation?.generate || "Generate",
      href: `/${lang}/timetable/generate`,
      hidden: !isAdmin,
    },
    {
      name: d?.navigation?.conflicts || "Conflicts",
      href: `/${lang}/timetable/conflicts`,
      hidden: !canManageConflicts(role),
    },
    {
      name: d?.navigation?.settings || "Settings",
      href: `/${lang}/timetable/settings`,
      hidden: !canConfigureSettings(role),
    },

    // Non-admin tabs
    {
      name: d?.studentView?.today || "Today",
      href: `/${lang}/timetable`,
      hidden: isAdmin,
    },
    {
      name: d?.studentView?.weekView || "Full",
      href: `/${lang}/timetable/full`,
      hidden: isAdmin,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Timetable"} />
      <PageNav pages={timetablePages} />
      {children}
    </div>
  )
}
