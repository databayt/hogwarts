// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Geofence Attendance Page
 * Route: /[lang]/s/[subdomain]/attendance/geo
 *
 * Geofence configuration is admin/teacher tooling. Students don't see the
 * editor — their location pings happen via the mobile app.
 */

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { GeofenceContent } from "@/components/school-dashboard/attendance/geofencee/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function GeofencePage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    redirect(`/${lang}/attendance`)
  }

  return <GeofenceContent />
}

export const metadata = {
  title: "Geofence Tracking | Hogwarts",
  description: "Automatic attendance tracking using GPS location",
}
