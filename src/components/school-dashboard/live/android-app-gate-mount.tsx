// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { getSchoolTimeZone } from "@/components/school-dashboard/attendance/core/school-day"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { loadFeature } from "@/components/internationalization/namespaces"

import { AndroidAppGate } from "./android-app-gate"
import { schoolAndroidApp } from "./android-app"

/** The roles that join live classes — the only ones the Android app gate applies to. */
const CLASS_ROLES = new Set(["STUDENT", "TEACHER", "GUARDIAN"])

/**
 * Server side of the Android browser gate: renders nothing unless the school
 * has its own app, then hands the client gate the school's time zone and the
 * words. Mount in the dashboard, messaging and live-room layouts. Applies only
 * to a signed-in student, teacher or parent (see CLASS_ROLES).
 */
export async function AndroidAppGateMount({
  subdomain,
  lang,
}: {
  subdomain: string | null | undefined
  lang: string
}) {
  const loc = lang === "en" ? "en" : "ar"
  const app = schoolAndroidApp(subdomain, loc)
  if (!app || !subdomain) return null
  const [school, dict, session] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    loadFeature("liveClasses", loc) as Promise<Record<string, any>>,
    auth().catch(() => null),
  ])
  // Only people who JOIN classes are sent to the app. Admins, staff and
  // accountants read the reports (analysis, members, dashboard) that live on
  // the web only, and a signed-out visitor must still reach the login form —
  // the school's owner was locked out of her own reports (2026-11-25).
  const role = session?.user?.role
  if (!session?.user?.id || !role || !CLASS_ROLES.has(role)) return null
  const schoolId = school.success ? school.data?.id : undefined
  const timeZone = schoolId ? await getSchoolTimeZone(schoolId) : null
  const g = dict.appGate
  return (
    <AndroidAppGate
      subdomain={subdomain}
      lang={loc}
      timeZone={timeZone}
      signedIn={!!session?.user?.id}
      labels={{ ...g, title: g.title.replaceAll("{app}", app.name) }}
    />
  )
}
