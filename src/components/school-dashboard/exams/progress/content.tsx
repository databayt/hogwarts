import Link from "next/link"
import { auth } from "@/auth"
import { Calendar, FileText, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getProgressSchedules } from "./actions"
import { ProgressScheduleList } from "./schedule-list"

export async function ProgressReportContent() {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const schedules = await getProgressSchedules()

  const role = session.user.role || "USER"
  const canManage = ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)

  const activeSchedules = schedules.filter((s) => s.isActive)
  const totalReports = schedules.reduce((sum, s) => sum + s.reportCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Progress Reports
          </h2>
          <p className="text-muted-foreground">
            Schedule automated progress reports for students and parents
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="progress/new">
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Schedules
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-muted-foreground text-xs">
              {activeSchedules.length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchedules.length}</div>
            <p className="text-muted-foreground text-xs">Running schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Generated
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>
      </div>

      <ProgressScheduleList schedules={schedules} canManage={canManage} />
    </div>
  )
}

export default ProgressReportContent
