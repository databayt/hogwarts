// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { checkAttendancePermission } from "@/components/school-dashboard/attendance/authorization"
import { BulkUploadContent } from "@/components/school-dashboard/attendance/bulk-upload/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary?.attendanceTake?.meta
  return {
    title: t?.upload ?? "Attendance · Upload a file",
    description: t?.description,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""

  // Check permissions - staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(role)) {
    return <AttendanceAccessDenied lang={lang} />
  }

  const canUpload = checkAttendancePermission(
    {
      userId: session?.user?.id ?? "",
      role: role as never,
      schoolId: session?.user?.schoolId ?? null,
    },
    "bulk_upload"
  )

  return <BulkUploadContent canUpload={canUpload} />
}
