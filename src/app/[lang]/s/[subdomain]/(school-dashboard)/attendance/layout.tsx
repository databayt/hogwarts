// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function AttendanceLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.attendance as Record<string, any> | undefined

  const role = session?.user?.role ?? ""
  const isStaff = STAFF_ROLES.includes(role)
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"

  const basePath = `/${lang}/attendance`

  // Role-based tab visibility:
  // - Overview: always visible
  // - Mark, QR Code: staff only (attendance methods)
  // - Records: student/guardian only (staff uses Reports)
  // - Excuses: always visible (different modes per role)
  // - Early Warning, Interventions: staff only (student support)
  // - Analytics, Reports: staff only
  // - Settings: admin/developer only
  const attendancePages: PageNavItem[] = [
    { name: d?.overview || "Overview", href: basePath, exact: true },
    {
      name: d?.manual || "Manual",
      href: `${basePath}/manual`,
      hidden: !isStaff,
    },
    {
      name: d?.navQrCode || "QR Code",
      href: `${basePath}/qr-code`,
      hidden: !isStaff,
    },
    {
      name: d?.records || "Records",
      href: `${basePath}/records`,
      hidden: isStaff,
    },
    { name: d?.excuses || "Excuses", href: `${basePath}/excuses` },
    {
      name: d?.earlyWarning || "Early Warning",
      href: `${basePath}/early-warning`,
      hidden: !isStaff,
    },
    {
      name: d?.interventions || "Interventions",
      href: `${basePath}/interventions`,
      hidden: !isStaff,
    },
    {
      name: d?.analytics || "Analytics",
      href: `${basePath}/analytics`,
      hidden: !isStaff,
    },
    {
      name: d?.reports || "Reports",
      href: `${basePath}/reports`,
      hidden: !isStaff,
    },
    {
      name: d?.settings || "Settings",
      href: `${basePath}/settings`,
      hidden: !isAdmin,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Attendance"} />
      <PageNav pages={attendancePages} />

      {children}
    </div>
  )
}
