// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { KioskContent } from "@/components/school-dashboard/attendance/kiosk/content"

export const metadata = { title: "Dashboard: Attendance Kiosk" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session, { schoolId }] = await Promise.all([
    params,
    auth(),
    getTenantContext(),
  ])
  // Admin/Developer only for kiosk setup
  if (!["ADMIN", "DEVELOPER"].includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  const [dictionary, school] = await Promise.all([
    getDictionary(lang),
    db.school.findUnique({
      where: { id: schoolId ?? undefined },
      select: { name: true, logoUrl: true },
    }),
  ])

  return (
    <KioskContent
      schoolId={schoolId ?? ""}
      schoolName={school?.name ?? "School"}
      schoolLogo={school?.logoUrl}
      locale={lang}
      kioskSession={null}
    />
  )
}
