import { auth } from "@/auth"
import { Activity, CheckCircle2, Clock, Plus, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getQuickAssessments } from "./actions"
import { QuickAssessmentList } from "./list"

export async function QuickAssessmentContent() {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const assessments = await getQuickAssessments()

  const role = session.user.role || "USER"
  const canCreate = ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)

  const stats = {
    total: assessments.length,
    active: assessments.filter((a) => a.status === "ACTIVE").length,
    completed: assessments.filter((a) => a.status === "CLOSED").length,
    totalResponses: assessments.reduce((sum, a) => sum + a.responseCount, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quick Assessments
          </h2>
          <p className="text-muted-foreground">
            Create and manage exit tickets, polls, warm-ups, and check-ins
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <a href="quick/new">
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              All quick assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-muted-foreground text-xs">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-muted-foreground text-xs">
              Finished assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-muted-foreground text-xs">
              Total student responses
            </p>
          </CardContent>
        </Card>
      </div>

      <QuickAssessmentList assessments={assessments} canManage={canCreate} />
    </div>
  )
}

export default QuickAssessmentContent
