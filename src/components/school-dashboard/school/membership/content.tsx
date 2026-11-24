import { auth } from "@/auth"

import { db } from "@/lib/db"
import { schoolNameContact } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { loadMemberReadiness } from "@/components/school-dashboard/school/readiness/queries"

import { canManageMembers } from "./authorization"
import {
  getAcademicGrades,
  getPendingRequests,
  getUnifiedMembers,
} from "./queries"
import {
  attendancePct,
  relativeLastSeen,
} from "./readiness-cells"
import { MembershipTable } from "./table"
import type { MemberReadinessFields } from "./types"

interface Props {
  dictionary: Dictionary
  lang: Locale
  /** `?q=` — initial search text (the dashboard links here). */
  initialSearch?: string
}

export default async function MembershipContent({
  dictionary,
  lang,
  initialSearch,
}: Props) {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const userRole = session?.user?.role

  // The shared school dictionary wins; schoolConsole fills the keys it lacks.
  const merged: Record<string, any> = {
    ...(dictionary.schoolConsole.membership as Record<string, any>),
    ...((dictionary as Record<string, any>)?.school?.membership || {}),
  }
  // `readiness` is a nested block; the table reads flat `readiness_<key>`.
  const { readiness: readinessBlock, ...flat } = merged
  const t: Record<string, string> = { ...flat }
  for (const [k, v] of Object.entries(readinessBlock ?? {})) {
    if (typeof v === "string") t[`readiness_${k}`] = v
  }

  // The students/teachers credentials dialog labels — the reset dialog shares
  // that dialog's look and words.
  const credentialsLabels: Record<string, string> =
    (dictionary as Record<string, any>)?.school?.students?.credentials || {}

  if (!schoolId) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        {t.noSchoolContext}
      </p>
    )
  }

  const [members, pendingRequests, grades, school, nameContact] =
    await Promise.all([
      getUnifiedMembers(schoolId),
      getPendingRequests(schoolId),
      getAcademicGrades(schoolId),
      db.school.findUnique({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      }),
      schoolNameContact(schoolId, "member"),
    ])

  const canManage = userRole ? canManageMembers(userRole) : false
  const contentLang = (school?.preferredLanguage || "ar") as "ar" | "en"

  // Translate names — one batched, deduped resolution (no per-row N+1)
  const labels = await getLabels(
    members.flatMap((m) => [m.name, m.gradeName]),
    lang,
    schoolId
  )

  // Readiness for every member — one batched read, joined by userId. A failure
  // must not take the members page down: the columns just show "—".
  const now = new Date()
  const readinessById = new Map<string, MemberReadinessFields>()
  try {
    const rows = await loadMemberReadiness(schoolId, {
      userIds: members.map((m) => m.id),
      now,
    })
    for (const r of rows) {
      const graded = r.role === "TEACHER" || r.role === "STUDENT"
      readinessById.set(r.userId, {
        deviceClient: r.device.client,
        devicePlatform: r.device.platform,
        appVersion: r.device.appVersion,
        lastSeenAtStr: relativeLastSeen(
          r.lastSeenAt,
          now,
          lang,
          DEFAULT_SCHOOL_TZ
        ),
        attendancePct: attendancePct(r.attendance),
        // Only teachers and students are graded: a guardian or admin who never
        // opened the platform isn't a class-readiness problem.
        readinessLevel: graded ? r.readiness.level : null,
        readinessReasons: graded ? r.readiness.reasons : [],
        failedSignIns3d: r.failedSignIns3d,
        pushOn: r.pushOn,
      })
    }
  } catch (error) {
    console.error("[membership] readiness load failed:", error)
  }

  const translatedMembers = members.map((m) => ({
    ...m,
    ...readinessById.get(m.id),
    name: labels.get(m.name) ?? m.name,
    gradeName: m.gradeName ? (labels.get(m.gradeName) ?? m.gradeName) : null,
  }))

  return (
    <div className="space-y-6">
      {/* Members Table */}
      <MembershipTable
        members={translatedMembers}
        pendingRequests={pendingRequests}
        grades={grades}
        canManage={canManage}
        nameContact={nameContact}
        lang={lang}
        t={t}
        credentialsLabels={credentialsLabels}
        currentUserId={session?.user?.id}
        initialSearch={initialSearch}
      />
    </div>
  )
}
