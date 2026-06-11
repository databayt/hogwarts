import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import { canManageMembers } from "./authorization"
import {
  getAcademicGrades,
  getMembershipStats,
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

  const t = (dictionary as Record<string, any>)?.school?.membership || {}

  if (!schoolId) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No school context
      </p>
    )
  }

  const [members, stats, pendingRequests, grades, school] = await Promise.all([
    getUnifiedMembers(schoolId),
    getMembershipStats(schoolId),
    getPendingRequests(schoolId),
    getAcademicGrades(schoolId),
    db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    }),
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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 py-4">
          <CardContent className="p-0">
            <span className="text-foreground text-3xl font-semibold">
              {stats.total.toLocaleString()}
            </span>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {t.totalMembers || "Total Members"}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 py-4">
          <CardContent className="p-0">
            <span className="text-foreground text-3xl font-semibold">
              {stats.active.toLocaleString()}
            </span>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {t.activeMembers || "Active Members"}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 py-4">
          <CardContent className="p-0">
            <span className="text-foreground text-3xl font-semibold">
              {stats.suspended.toLocaleString()}
            </span>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {t.suspended || "Suspended"}
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 py-4">
          <CardContent className="p-0">
            <span className="text-foreground text-3xl font-semibold">
              {stats.pending.toLocaleString()}
            </span>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {t.pendingRequests || "Pending Requests"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <MembershipTable
        members={translatedMembers}
        pendingRequests={pendingRequests}
        grades={grades}
        canManage={canManage}
        lang={lang}
        t={t}
      />
    </div>
  )
}
