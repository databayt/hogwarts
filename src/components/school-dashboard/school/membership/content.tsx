import { auth } from "@/auth"
import { Clock, ShieldAlert, UserCheck, Users } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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

  const [members, stats, pendingRequests, grades] = await Promise.all([
    getUnifiedMembers(schoolId),
    getMembershipStats(schoolId),
    getPendingRequests(schoolId),
    getAcademicGrades(schoolId),
  ])

  const canManage = userRole ? canManageMembers(userRole) : false

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.totalMembers || "Total Members"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.allRegistered || "All registered members"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.activeMembers || "Active Members"}
            </CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.active.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.verifiedAndActive || "Verified and active"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.suspended || "Suspended"}
            </CardTitle>
            <ShieldAlert className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.suspended.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.suspendedAccounts || "Suspended accounts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.pendingRequests || "Pending Requests"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pending.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {t.awaitingApproval || "Awaiting approval"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <MembershipTable
        members={members}
        pendingRequests={pendingRequests}
        grades={grades}
        canManage={canManage}
        lang={lang}
        t={t}
      />
    </div>
  )
}
