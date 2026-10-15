// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Geofence Attendance Page
 * Route: /[lang]/s/[subdomain]/attendance/geo
 *
 * Geofence configuration is admin/teacher tooling — the live student
 * locations panel and zone editor are not appropriate for students or
 * guardians to load. Their location pings happen via the mobile app
 * authenticated through `/api/mobile/...`.
 */

import type { Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { GeofenceContent } from "@/components/school-dashboard/attendance/geofencee/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function GeofencePage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Inline denial, not redirect() — a parent-segment redirect racing a child
  // stream caused React #310 in production (see (school-dashboard)/layout.tsx).
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
  }

  return <GeofenceContent lang={lang} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary?.attendanceTake?.meta
  return {
    title: t?.geo ?? "Attendance · Location check-in",
    description: t?.description,
  }
}
