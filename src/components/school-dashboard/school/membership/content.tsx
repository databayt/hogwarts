import { auth } from "@/auth"

import { db } from "@/lib/db"
import { schoolNameContact } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import { canManageMembers } from "./authorization"
import {
  getAcademicGrades,
  getPendingRequests,
  getUnifiedMembers,
} from "./queries"
import { MembershipTable } from "./table"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function MembershipContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const userRole = session?.user?.role

  // The shared school dictionary wins; schoolConsole fills the keys it lacks.
  const t: Record<string, string> = {
    ...(dictionary.schoolConsole.membership as Record<string, string>),
    ...((dictionary as Record<string, any>)?.school?.membership || {}),
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
  const translatedMembers = members.map((m) => ({
    ...m,
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
      />
    </div>
  )
}
