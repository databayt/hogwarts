"use client"

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

  const handleGenerate = async (scheduleId: string) => {
    setGeneratingId(scheduleId)
    try {
      const result = await generateProgressReports(scheduleId)
      if (result.success) {
        toast({
          title: "Success",
          description: `Generated ${result.data?.generated} reports${
            result.data?.failed ? `, ${result.data.failed} failed` : ""
          }`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate reports",
        variant: "destructive",
      })
    } finally {
      setGeneratingId(null)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    setDeletingId(scheduleId)
    try {
      const result = await deleteProgressSchedule(scheduleId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
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
          <CardTitle>No Schedules</CardTitle>
          <CardDescription>
            Create a schedule to start generating automated progress reports.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Schedules</CardTitle>
        <CardDescription>
          Manage automated progress report generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Reports</TableHead>
              {canManage && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>
                  {schedule.className || (
                    <span className="text-muted-foreground">All classes</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {schedule.frequency.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {schedule.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {schedule.lastRunAt ? (
                    <time className="text-sm">
                      {format(new Date(schedule.lastRunAt), "MMM d, HH:mm")}
                    </time>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
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
