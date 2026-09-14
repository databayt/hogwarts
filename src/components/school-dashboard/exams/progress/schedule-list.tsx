"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { Calendar, Play, Trash2 } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { ListRow, ListRows } from "@/components/school-dashboard/shared"

import { deleteProgressSchedule, generateProgressReports } from "./actions"
import type { ProgressScheduleSummary } from "./types"

interface ProgressScheduleListProps {
  schedules: ProgressScheduleSummary[]
  canManage: boolean
}

export function ProgressScheduleList({
  schedules,
  canManage,
}: ProgressScheduleListProps) {
  const { toast } = useToast()
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const p = dictionary?.school?.exams?.progress
  const t = p?.schedule
  const sl = dictionary?.school?.exams?.scheduleList
  // ProgressReportFrequency is a fixed 4-value enum (prisma/models/progress-reports.prisma);
  // the raw value used to render straight into the badge ("TERM_END" un-underscored).
  const frequencyLabels: Record<string, string> = {
    WEEKLY: p?.frequency?.weekly ?? "Weekly",
    BIWEEKLY: p?.frequency?.biweekly ?? "Biweekly",
    MONTHLY: p?.frequency?.monthly ?? "Monthly",
    TERM_END: p?.frequency?.termEnd ?? "Term End",
  }
  const frequencyLabel = (frequency: string) =>
    frequencyLabels[frequency] ?? frequency.replace("_", " ")
  const lastRunLabel = (date: Date | null) =>
    date
      ? formatDate(date, locale, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : (sl?.never ?? "Never")

  const handleGenerate = async (scheduleId: string) => {
    setGeneratingId(scheduleId)
    try {
      const result = await generateProgressReports(scheduleId)
      if (result.success) {
        toast({
          title: p?.toast?.success ?? "Success",
          description: `Generated ${result.data?.generated} reports${
            result.data?.failed ? `, ${result.data.failed} failed` : ""
          }`,
        })
      } else {
        toast({
          title: p?.toast?.error ?? "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: p?.toast?.error ?? "Error",
        description: t?.toast?.generateFailed ?? "Failed to generate reports",
        variant: "destructive",
      })
    } finally {
      setGeneratingId(null)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (
      !confirm(
        t?.toast?.deleteConfirm ??
          "Are you sure you want to delete this schedule?"
      )
    )
      return

    setDeletingId(scheduleId)
    try {
      const result = await deleteProgressSchedule(scheduleId)
      if (result.success) {
        toast({
          title: p?.toast?.success ?? "Success",
          description: t?.toast?.deleted ?? "Schedule deleted successfully",
        })
      } else {
        toast({
          title: p?.toast?.error ?? "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: p?.toast?.error ?? "Error",
        description: t?.toast?.deleteFailed ?? "Failed to delete schedule",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (schedules.length === 0) {
    return (
      <Card className="max-md:bg-muted max-md:border-0">
        <CardHeader>
          <CardTitle>{t?.noSchedules ?? "No Schedules"}</CardTitle>
          <CardDescription>
            {sl?.noSchedulesDescription ??
              "Create a schedule to start generating automated progress reports."}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      {/* Phone: the table's seven columns crush below md — each schedule as
          a grey list row instead (class + frequency, status badge, last/next
          run in the meta line, report count and the manage actions trailing). */}
      <div className="bg-muted overflow-hidden rounded-xl md:hidden">
        <ListRows divided>
          {schedules.map((schedule) => (
            <ListRow
              key={schedule.id}
              title={schedule.className || (sl?.allClasses ?? "All classes")}
              badge={
                schedule.isActive ? (
                  <Badge variant="default" className="max-md:bg-background">
                    {t?.active ?? "Active"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="max-md:bg-background">
                    {t?.inactive ?? "Inactive"}
                  </Badge>
                )
              }
              description={frequencyLabel(schedule.frequency)}
              meta={
                <>
                  <span>{lastRunLabel(schedule.lastRunAt)}</span>
                  {schedule.nextRunAt ? (
                    <span>
                      →{" "}
                      {formatDate(schedule.nextRunAt, locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </>
              }
              trailing={
                <div className="flex items-center gap-1">
                  <Link
                    href={`/exams/progress/${schedule.id}/reports`}
                    className="text-primary text-sm font-semibold"
                  >
                    {schedule.reportCount}
                  </Link>
                  {canManage && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => handleGenerate(schedule.id)}
                        disabled={
                          generatingId === schedule.id || !schedule.isActive
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deletingId === schedule.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </ListRows>
      </div>

      {/* Desktop: untouched table. */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t?.title ?? "Report Schedules"}</CardTitle>
          <CardDescription>
            {sl?.manageDescription ??
              "Manage automated progress report generation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t?.headers?.class ?? "Class"}</TableHead>
                <TableHead>{t?.headers?.frequency ?? "Frequency"}</TableHead>
                <TableHead>{t?.headers?.status ?? "Status"}</TableHead>
                <TableHead>{t?.headers?.lastRun ?? "Last Run"}</TableHead>
                <TableHead>{t?.headers?.nextRun ?? "Next Run"}</TableHead>
                <TableHead>{t?.headers?.reports ?? "Reports"}</TableHead>
                {canManage && (
                  <TableHead>{t?.headers?.actions ?? "Actions"}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    {schedule.className || (
                      <span className="text-muted-foreground">
                        {sl?.allClasses ?? "All classes"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {frequencyLabel(schedule.frequency)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schedule.isActive ? (
                      <Badge variant="default">{t?.active ?? "Active"}</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t?.inactive ?? "Inactive"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.lastRunAt ? (
                      <time className="text-sm">
                        {lastRunLabel(schedule.lastRunAt)}
                      </time>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {sl?.never ?? "Never"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.nextRunAt ? (
                      <time className="text-sm">
                        {formatDate(schedule.nextRunAt, locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/exams/progress/${schedule.id}/reports`}
                      className="text-primary hover:underline"
                    >
                      {schedule.reportCount}
                    </Link>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerate(schedule.id)}
                          disabled={
                            generatingId === schedule.id || !schedule.isActive
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deletingId === schedule.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
