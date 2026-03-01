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
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.attendance

  const role = session?.user?.role ?? ""
  const isStaff = STAFF_ROLES.includes(role)

  const basePath = `/${lang}/s/${subdomain}/attendance`

  // Role-based tab visibility:
  // - Overview: always visible
  // - Mark, QR Code, Barcode: staff only
  // - Records: student/guardian only (staff uses Reports)
  // - Excuses: always visible (different modes per role)
  // - Analytics, Reports: staff only
  // - Settings: admin/developer only
  const attendancePages: PageNavItem[] = [
    { name: d?.overview || "Overview", href: basePath },
    { name: d?.manual || "Mark", href: `${basePath}/manual`, hidden: !isStaff },
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
      hidden: role !== "ADMIN" && role !== "DEVELOPER",
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
