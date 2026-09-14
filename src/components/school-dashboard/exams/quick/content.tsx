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
      <div className="flex items-center justify-between max-md:flex-col max-md:items-stretch max-md:gap-3">
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
          <Button
            asChild
            className="max-md:h-10 max-md:w-auto max-md:self-start max-md:rounded-full max-md:px-5"
          >
            <a href="quick/new">
              <Plus className="me-2 h-4 w-4" />
              {d?.newAssessment ?? "New Assessment"}
            </a>
          </Button>
        )}
      </div>

      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.total ?? "Total"}
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {stats.total}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.allAssessments ?? "All quick assessments"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.active ?? "Active"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {stats.active}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.currentlyRunning ?? "Currently running"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.completed ?? "Completed"}
            </CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {stats.completed}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.finishedAssessments ?? "Finished assessments"}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.responses ?? "Responses"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {stats.totalResponses}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
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
