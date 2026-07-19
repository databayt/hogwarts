// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { InterventionsContent } from "@/components/school-dashboard/attendance/interventions/content"

export const metadata = { title: "Dashboard: Interventions" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Interventions are an MTSS staff workflow — students/guardians don't
  // manage them. Inline denial, not redirect() (React #310 — see
  // (school-dashboard)/layout.tsx).
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <InterventionsContent locale={lang} />
}
