"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, Play, Trash2 } from "lucide-react"

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
  const p = dictionary?.school?.exams?.progress
  const t = p?.schedule
  const sl = dictionary?.school?.exams?.scheduleList

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
      <Card>
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
    <Card>
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
                    {schedule.frequency.replace("_", " ")}
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
                      {format(new Date(schedule.lastRunAt), "MMM d, HH:mm")}
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
                      {format(new Date(schedule.nextRunAt), "MMM d, HH:mm")}
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
  )
}
