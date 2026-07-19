// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { ExcusesContent } from "@/components/school-dashboard/attendance/excuses/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.excuses || "Excuses",
    description: "Manage attendance excuses",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

// Excuses page widens beyond staff: GUARDIANs submit excuses, STUDENTs
// view their own. Other roles (ACCOUNTANT, USER, undefined) are redirected.
const ALLOWED_ROLES = [
  "ADMIN",
  "TEACHER",
  "STAFF",
  "DEVELOPER",
  "GUARDIAN",
  "STUDENT",
]

export default async function Page({ params }: Props) {
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])

  const role = session?.user?.role ?? ""
  // Inline denial, not redirect() (React #310 — see (school-dashboard)/layout.tsx).
  if (!ALLOWED_ROLES.includes(role)) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <ExcusesContent locale={lang} subdomain={subdomain} role={role} />
}
