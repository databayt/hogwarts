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
  rendersStudentTimetable,
  type TimetableRole,
} from "@/components/school-dashboard/timetable/permissions-config"
import { TimetableShellProvider } from "@/components/school-dashboard/timetable/shell-context"

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
  // A student sees one thing: the week grid for their own section, rendered by
  // StudentView on this route. The Today/Full split is left in place for
  // TEACHER and GUARDIAN, whose views still switch on it.
  const isStudent = role === "STUDENT"
  // Which SHAPE the loading placeholder takes — a wider question than the tab
  // strip's `isStudent`, since USER falls through to the student view too.
  const isStudentSurface = rendersStudentTimetable(role)

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
      hidden: isAdmin || isStudent,
    },
    {
      name: d?.studentView?.weekView || "Full",
      href: `/${lang}/timetable/full`,
      hidden: isAdmin || isStudent,
    },
  ]

  // PageNav still paints its bottom border with every item hidden, so a role
  // with no tabs gets a stray rule under the heading. Skip the strip instead.
  const hasTabs = timetablePages.some((page) => !page.hidden)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Timetable"} />
      {hasTabs && <PageNav pages={timetablePages} />}
      {/* The route's `loading.tsx` is the boundary here (Next nests it as
          layout > Suspense > page, so sub-routes with their own keep theirs).
          It exists again because a dynamic route WITHOUT one is never
          prefetched — the sidebar's Timetable tap showed nothing until the
          whole server response landed. What the manual boundary that sat
          here had over it was the role: `loading.tsx` cannot await the
          session, so it drew the five-day week for a phone about to show one
          column. The provider hands that answer down instead, and the
          fallback reads it. */}
      <TimetableShellProvider studentShell={isStudentSurface}>
        {children}
      </TimetableShellProvider>
    </div>
  )
}
