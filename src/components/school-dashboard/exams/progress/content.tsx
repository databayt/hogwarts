// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { Calendar, FileText, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getProgressSchedules } from "./actions"
import { ProgressScheduleList } from "./schedule-list"

export async function ProgressReportContent({
  lang = "ar",
}: {
  lang?: Locale
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const dictionary = await getDictionary(lang)
  const t = dictionary?.school?.exams?.progress
  const pc = dictionary?.school?.exams?.progressContent

  const schedules = await getProgressSchedules()

  const role = session.user.role || "USER"
  const canManage = ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)

  const activeSchedules = schedules.filter((s) => s.isActive)
  const totalReports = schedules.reduce((sum, s) => sum + s.reportCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-md:flex-col max-md:items-stretch max-md:gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {pc?.title ?? "Progress Reports"}
          </h2>
          <p className="text-muted-foreground">
            {pc?.description ??
              "Schedule automated progress reports for students and parents"}
          </p>
        </div>
        {canManage && (
          <Button
            asChild
            className="max-md:h-10 max-md:w-auto max-md:self-start max-md:rounded-full max-md:px-5"
          >
            <Link href="progress/new">
              <Plus className="me-2 h-4 w-4" />
              {pc?.newSchedule ?? "New Schedule"}
            </Link>
          </Button>
        )}
      </div>

      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {pc?.totalSchedules ?? "Total Schedules"}
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {schedules.length}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {(pc?.activeCount ?? "{count} active").replace(
                "{count}",
                String(activeSchedules.length)
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {pc?.activeLabel ?? "Active"}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {activeSchedules.length}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {pc?.runningSchedules ?? "Running schedules"}
            </p>
          </CardContent>
        </Card>
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {pc?.reportsGenerated ?? "Reports Generated"}
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {totalReports}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {pc?.allTime ?? "All time"}
            </p>
          </CardContent>
        </Card>
      </div>

      <ProgressScheduleList schedules={schedules} canManage={canManage} />
    </div>
  )
}

export default ProgressReportContent
