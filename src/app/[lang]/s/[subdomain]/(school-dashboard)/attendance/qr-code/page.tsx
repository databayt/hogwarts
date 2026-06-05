// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"
import QRCodeAttendanceContent from "@/components/school-dashboard/attendance/qr-code/content"

export const metadata = { title: "Dashboard: QR Code Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const [dictionary, session] = await Promise.all([getDictionary(lang), auth()])

  // Staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return (
    <AttendanceProvider initialMethod="QR_CODE">
      <QRCodeAttendanceContent
        dictionary={dictionary}
        locale={lang}
        schoolId={session?.user?.schoolId!}
      />
    </AttendanceProvider>
  )
}
