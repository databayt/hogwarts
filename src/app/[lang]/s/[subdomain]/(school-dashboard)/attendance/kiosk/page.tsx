// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { KioskContent } from "@/components/school-dashboard/attendance/kiosk/content"
import { AttendanceSectionNav } from "@/components/school-dashboard/attendance/ui/section-nav"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary?.attendanceTake?.meta
  return {
    title: t?.kiosk ?? "Attendance · Self check-in kiosk",
    description: t?.description,
  }
}

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

  const school = await db.school.findUnique({
    where: { id: schoolId ?? undefined },
    select: { name: true, logoUrl: true },
  })

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="take" />
      <div className="overflow-hidden rounded-3xl border">
        <KioskContent
          schoolId={schoolId ?? ""}
          schoolName={school?.name ?? ""}
          schoolLogo={school?.logoUrl}
          locale={lang}
          kioskSession={null}
        />
      </div>
    </div>
  )
}
