"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  generateReportCards,
  getReportCards,
  publishReportCards,
} from "../actions/report-cards"

interface ReportCardsTableProps {
  initialData: any[]
  total: number
  terms: Array<{ id: string; termNumber: number }>
  grades: Array<{ id: string; name: string; gradeNumber: number }>
  defaultTermId?: string
}

export function ReportCardsTable({
  initialData,
  total,
  terms,
  grades,
  defaultTermId,
}: ReportCardsTableProps) {
  const [data, setData] = useState(initialData)
  const [count, setCount] = useState(total)
  const [termId, setTermId] = useState(defaultTermId || "")
  const [gradeId, setGradeId] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleTermChange = (newTermId: string) => {
    setTermId(newTermId)
    startTransition(async () => {
      const result = await getReportCards({
        termId: newTermId,
        gradeId: gradeId || undefined,
      })
      setData(result.items)
      setCount(result.total)
    })
  }

  const handleGradeChange = (newGradeId: string) => {
    setGradeId(newGradeId)
    if (termId) {
      startTransition(async () => {
        const result = await getReportCards({
          termId,
          gradeId: newGradeId === "all" ? undefined : newGradeId,
        })
        setData(result.items)
        setCount(result.total)
      })
    }
  }

  const handleGenerate = () => {
    if (!termId) return
    startTransition(async () => {
      const result = await generateReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      if (result.success) {
        // Refresh data
        const refreshed = await getReportCards({
          termId,
          gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
        })
        setData(refreshed.items)
        setCount(refreshed.total)
      }
    })
  }

  const handlePublish = () => {
    if (!termId) return
    startTransition(async () => {
      await publishReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      const refreshed = await getReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      setData(refreshed.items)
      setCount(refreshed.total)
    })
  }

  const unpublishedCount = data.filter((d: any) => !d.isPublished).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={termId} onValueChange={handleTermChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                Term {t.termNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={gradeId || "all"} onValueChange={handleGradeChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ms-auto flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!termId || isPending}
            variant="outline"
          >
            {isPending ? "Generating..." : "Generate Report Cards"}
          </Button>
          {unpublishedCount > 0 && (
            <Button onClick={handlePublish} disabled={isPending}>
              Publish ({unpublishedCount})
            </Button>
          )}
        </div>
      </div>

      <div className="text-muted-foreground text-sm">{count} report cards</div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No report cards found. Select a term and click &quot;Generate
                  Report Cards&quot;.
                </TableCell>
              </TableRow>
            ) : (
              data.map((rc: any) => (
                <TableRow key={rc.id}>
                  <TableCell className="font-medium">
                    {rc.rank || "-"}
                    {rc.totalStudents && (
                      <span className="text-muted-foreground">
                        /{rc.totalStudents}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {rc.student.givenName} {rc.student.surname}
                    </div>
                    {rc.student.studentId && (
                      <div className="text-muted-foreground text-xs">
                        {rc.student.studentId}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {rc.overallGPA ? Number(rc.overallGPA).toFixed(2) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rc.overallGrade || "-"}</Badge>
                  </TableCell>
                  <TableCell>{rc.grades?.length || 0} subjects</TableCell>
                  <TableCell className="text-sm">
                    {rc.daysPresent != null && (
                      <span>
                        P:{rc.daysPresent} A:{rc.daysAbsent || 0} L:
                        {rc.daysLate || 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.isPublished ? "default" : "secondary"}>
                      {rc.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
