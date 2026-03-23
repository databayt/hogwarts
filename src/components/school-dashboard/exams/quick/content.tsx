// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { Activity, CheckCircle2, Clock, Plus, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getQuickAssessments } from "./actions"
import { QuickAssessmentList } from "./list"

interface QuickAssessmentContentProps {
  dictionary?: Dictionary
}

export async function QuickAssessmentContent({
  dictionary,
}: QuickAssessmentContentProps) {
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

  const d = dictionary?.school?.exams?.quick?.content

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {d?.title ?? "Quick Assessments"}
          </h2>
          <p className="text-muted-foreground">
            {d?.description ??
              "Create and manage exit tickets, polls, warm-ups, and check-ins"}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <a href="quick/new">
              <Plus className="me-2 h-4 w-4" />
              {d?.newAssessment ?? "New Assessment"}
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.total ?? "Total"}
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">
              {d?.allAssessments ?? "All quick assessments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.active ?? "Active"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-muted-foreground text-xs">
              {d?.currentlyRunning ?? "Currently running"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.completed ?? "Completed"}
            </CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-muted-foreground text-xs">
              {d?.finishedAssessments ?? "Finished assessments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.responses ?? "Responses"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-muted-foreground text-xs">
              {d?.totalStudentResponses ?? "Total student responses"}
            </p>
          </CardContent>
        </Card>
      </div>

      <QuickAssessmentList assessments={assessments} canManage={canCreate} />
    </div>
  )
}

export default QuickAssessmentContent
