// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import BarcodeAttendanceContent from "@/components/school-dashboard/attendance/barcode/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary?.attendanceTake?.meta
  return {
    title: t?.barcode ?? "Attendance · ID cards",
    description: t?.description,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const session = await auth()
  const role = session?.user?.role ?? ""

  // Staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(role)) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return (
    <BarcodeAttendanceContent
      locale={lang}
      canManageCards={role === "ADMIN" || role === "DEVELOPER"}
    />
  )
}
