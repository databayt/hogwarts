// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
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
  const dictionary = await getDictionary(lang)

  // Admin/Developer only for kiosk setup
  if (!["ADMIN", "DEVELOPER"].includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          Only administrators can configure attendance kiosks.
        </p>
      </div>
    )
  }

  const school = await db.school.findUnique({
    where: { id: schoolId ?? undefined },
    select: { name: true, logoUrl: true },
  })

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
