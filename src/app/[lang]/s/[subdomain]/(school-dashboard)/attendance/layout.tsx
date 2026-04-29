// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTabsForRole } from "@/components/school-dashboard/attendance/permissions"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AttendanceLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.attendance as Record<string, any> | undefined
  const role = (session?.user?.role ?? null) as Role | null

  const attendancePages = getTabsForRole(role, lang, d)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Attendance"} />
      <PageNav pages={attendancePages} />

      {children}
    </div>
  )
}
