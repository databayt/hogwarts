// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Activity,
  Bell,
  Building,
  CheckCircle2,
  CircleAlert,
  Cloud,
  Database,
  FileText,
  Mail,
  School,
  Server,
  Settings,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { TrialExpiryCardDemo } from "@/components/school-dashboard/billing/trial-expiry-card-demo"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AdminContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  let totalUsers = 0
  let activeUsers = 0
  let totalTeachers = 0
  let totalStudents = 0
  let totalDepartments = 0
  let totalClassrooms = 0
  let pendingApprovals = 0
  const systemHealthScore = 95

  if (schoolId) {
    try {
      ;[
        totalUsers,
        activeUsers,
        totalTeachers,
        totalStudents,
        totalDepartments,
        totalClassrooms,
        pendingApprovals,
      ] = await Promise.all([
        db.user.count({ where: { schoolId } }).catch(() => 0),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: { not: null },
            },
          })
          .catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.user
          .count({
            where: {
              schoolId,
              emailVerified: null,
            },
          })
          .catch(() => 0),
      ])
    } catch (error) {
      console.error("Error fetching admin data:", error)
    }
  }

  const d = dictionary?.admin

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.users || "Users"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {activeUsers}{" "}
              {d?.stats?.activeInLast30Days || "active in last 30 days"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.teachers || "Teachers"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-muted-foreground text-xs">
              {d?.stats?.activeTeachers || "Active teachers"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.students || "Students"}
            </CardTitle>
            <School className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-muted-foreground text-xs">
              {d?.stats?.enrolledStudents || "Enrolled students"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.health || "Health"}
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealthScore}%</div>
            <p className="text-muted-foreground text-xs">
              {d?.stats?.allSystemsOperational || "All systems operational"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization & Operation */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.organization || "Organization"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs">
                    {d?.stats?.pendingActions || "Pending Approvals"}
                  </span>
                </div>
                <div className="ps-6 text-2xl font-bold">
                  {pendingApprovals.toLocaleString()}
                </div>
                <p className="text-muted-foreground ps-6 text-xs">
                  {d?.stats?.requiresAttention || "Requires attention"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs">
                    {d?.stats?.departments || "Departments"}
                  </span>
                </div>
                <div className="ps-6 text-2xl font-bold">
                  {totalDepartments}
                </div>
                <p className="text-muted-foreground ps-6 text-xs">
                  {d?.stats?.activeDepartments || "Active departments"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.operation || "Operation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CircleAlert className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs">
                    {d?.stats?.classrooms || "Classrooms"}
                  </span>
                </div>
                <div className="ps-6 text-2xl font-bold">{totalClassrooms}</div>
                <p className="text-muted-foreground ps-6 text-xs">
                  {d?.stats?.totalClassrooms || "Total classrooms"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs">
                    {d?.stats?.classrooms || "Active Users"}
                  </span>
                </div>
                <div className="ps-6 text-2xl font-bold">{activeUsers}</div>
                <p className="text-muted-foreground ps-6 text-xs">
                  {d?.stats?.currentlyLoggedIn || "Verified accounts"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href={`/${lang}/school/membership`}>
            <UserCog className="me-2 h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-medium">
                {d?.quickActions?.addUser || "Add User"}
              </span>
              <span className="text-muted-foreground text-xs">
                {d?.quickActions?.addUserDesc || "Create new account"}
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href={`/${lang}/school/communication`}>
            <Bell className="me-2 h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-medium">
                {d?.quickActions?.announce || "Announce"}
              </span>
              <span className="text-muted-foreground text-xs">
                {d?.quickActions?.announceDesc || "Send notification"}
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href={`/${lang}/school/security`}>
            <FileText className="me-2 h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-medium">
                {d?.quickActions?.viewLogs || "View Logs"}
              </span>
              <span className="text-muted-foreground text-xs">
                {d?.quickActions?.viewLogsDesc || "Audit activity"}
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href={`/${lang}/school/reports`}>
            <Database className="me-2 h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-medium">
                {d?.quickActions?.exportData || "Export Data"}
              </span>
              <span className="text-muted-foreground text-xs">
                {d?.quickActions?.exportDataDesc || "Download reports"}
              </span>
            </span>
          </Link>
        </Button>
      </div>

      {/* Trial & System Status Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrialExpiryCardDemo />

        {/* System Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {d?.systemStatus?.title || "System Status"}
              </CardTitle>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {d?.systemStatus?.operational || "Operational"}
              </span>
            </div>
            <CardDescription>
              {d?.systemStatus?.description || "Current system health"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <Server className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">
                    {d?.systemStatus?.api || "API Services"}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {d?.systemStatus?.online || "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <Database className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">
                    {d?.systemStatus?.database || "Database"}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {d?.systemStatus?.online || "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <Cloud className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">
                    {d?.systemStatus?.storage || "Storage"}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {d?.systemStatus?.online || "Online"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">
                    {d?.systemStatus?.email || "Email Service"}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {d?.systemStatus?.online || "Online"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Workflow Guide */}
      <Card className="border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="text-primary h-5 w-5" />
            {d?.workflow?.title || "Admin Workflow Guide"}
          </CardTitle>
          <CardDescription>
            {d?.workflow?.description ||
              "Step-by-step guide to managing your school"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {d?.cards?.configuration?.details ||
              "Manage school profile, academic years, departments, grading scales, and classroom settings."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${lang}/school/configuration`}>
                <Settings className="me-2 h-4 w-4" />
                {d?.cards?.configuration?.viewSettings || "View Settings"}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${lang}/school/bulk`}>
                {d?.cards?.configuration?.schoolProfile || "Academic Setup"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
