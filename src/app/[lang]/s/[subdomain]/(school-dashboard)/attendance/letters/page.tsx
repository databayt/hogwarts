// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { LettersContent } from "@/components/school-dashboard/attendance/letters/content"

export const metadata = { title: "Dashboard: Compliance Letters" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang)

  if (!["ADMIN", "DEVELOPER"].includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <LettersContent locale={lang} />
}
