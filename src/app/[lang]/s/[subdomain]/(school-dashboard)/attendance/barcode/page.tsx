// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BarcodeAttendanceContent from "@/components/school-dashboard/attendance/barcode/content"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export const metadata = { title: "Dashboard: Barcode Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  // Staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access barcode attendance.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider initialMethod="BARCODE">
      <BarcodeAttendanceContent
        dictionary={dictionary}
        locale={lang}
        schoolId={session?.user?.schoolId!}
      />
    </AttendanceProvider>
  )
}
