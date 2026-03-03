"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  approvePromotionBatch,
  evaluatePromotionCandidates,
  executePromotions,
  getPromotionBatches,
  getPromotionCandidates,
  overridePromotionDecision,
} from "../actions/promotion"

interface PromotionDashboardProps {
  batches: any[]
  years: Array<{ id: string; yearName: string }>
  grades: Array<{ id: string; name: string; gradeNumber: number }>
}

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  EVALUATING: "outline",
  READY_FOR_REVIEW: "default",
  APPROVED: "default",
  EXECUTING: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
}

const DECISION_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PROMOTE: "default",
  RETAIN: "destructive",
  CONDITIONAL: "outline",
  GRADUATE: "default",
  MANUAL_REVIEW: "secondary",
}

export function PromotionDashboard({
  batches: initialBatches,
  years,
  grades,
}: PromotionDashboardProps) {
  const [batches, setBatches] = useState(initialBatches)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [yearId, setYearId] = useState(years[0]?.id || "")
  const [gradeId, setGradeId] = useState("")
  const [isPending, startTransition] = useTransition()

  const selectedBatch = batches.find((b: any) => b.id === selectedBatchId)

  const handleEvaluate = () => {
    if (!yearId || !gradeId) return
    startTransition(async () => {
      const result = await evaluatePromotionCandidates({ yearId, gradeId })
      if (result.success) {
        const refreshed = await getPromotionBatches()
        setBatches(refreshed)
        if (result.data) {
          setSelectedBatchId(result.data.batchId)
          const cands = await getPromotionCandidates(result.data.batchId)
          setCandidates(cands)
        }
      }
    })
  }

  const handleViewCandidates = (batchId: string) => {
    setSelectedBatchId(batchId)
    startTransition(async () => {
      const cands = await getPromotionCandidates(batchId)
      setCandidates(cands)
    })
  }

  const handleOverride = (candidateId: string, decision: string) => {
    const reason = window.prompt("Override reason:")
    if (!reason) return
    startTransition(async () => {
      await overridePromotionDecision({
        candidateId,
        decision: decision as any,
        reason,
      })
      if (selectedBatchId) {
        const cands = await getPromotionCandidates(selectedBatchId)
        setCandidates(cands)
      }
    })
  }

  const handleApprove = () => {
    if (!selectedBatchId) return
    startTransition(async () => {
      const result = await approvePromotionBatch(selectedBatchId)
      if (result.success) {
        const refreshed = await getPromotionBatches()
        setBatches(refreshed)
      }
    })
  }

  const handleExecute = () => {
    if (!selectedBatchId) return
    if (
      !window.confirm(
        "Execute all approved promotions? This action cannot be undone."
      )
    )
      return
    startTransition(async () => {
      await executePromotions(selectedBatchId)
      const refreshed = await getPromotionBatches()
      setBatches(refreshed)
    })
  }

  return (
    <div className="space-y-6">
      {/* New evaluation */}
      <Card>
        <CardHeader>
          <CardTitle>Year-End Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={yearId} onValueChange={setYearId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="School Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.yearName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeId} onValueChange={setGradeId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleEvaluate}
              disabled={!yearId || !gradeId || isPending}
            >
              {isPending ? "Evaluating..." : "Evaluate Students"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batches list */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Promoted</TableHead>
                <TableHead>Retained</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No promotion batches yet. Select a year and grade to
                    evaluate.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((b: any) => (
                  <TableRow
                    key={b.id}
                    className={selectedBatchId === b.id ? "bg-muted/50" : ""}
                  >
                    <TableCell>{b.year?.yearName}</TableCell>
                    <TableCell>{b.grade?.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[b.status] || "secondary"}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{b.totalStudents}</TableCell>
                    <TableCell>{b.promotedCount + b.graduatedCount}</TableCell>
                    <TableCell>{b.retainedCount}</TableCell>
                    <TableCell>
                      {b.manualReviewCount + b.conditionalCount}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCandidates(b.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Candidates table */}
      {selectedBatchId && candidates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Candidates ({candidates.length})</CardTitle>
              <div className="flex gap-2">
                {selectedBatch?.status === "READY_FOR_REVIEW" && (
                  <Button onClick={handleApprove} disabled={isPending}>
                    Approve Batch
                  </Button>
                )}
                {selectedBatch?.status === "APPROVED" && (
                  <Button
                    onClick={handleExecute}
                    disabled={isPending}
                    variant="destructive"
                  >
                    Execute Promotions
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Auto</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">
                        {c.student.givenName} {c.student.surname}
                      </div>
                      {c.student.studentId && (
                        <div className="text-muted-foreground text-xs">
                          {c.student.studentId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {c.overallGPA ? Number(c.overallGPA).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell>
                      {c.overallPercentage != null
                        ? `${Number(c.overallPercentage).toFixed(1)}%`
                        : "-"}
                    </TableCell>
                    <TableCell>{c.failedSubjects}</TableCell>
                    <TableCell>
                      {c.attendancePercent != null
                        ? `${Number(c.attendancePercent).toFixed(1)}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={DECISION_COLORS[c.autoDecision] || "secondary"}
                      >
                        {c.autoDecision}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          DECISION_COLORS[c.finalDecision] || "secondary"
                        }
                      >
                        {c.finalDecision}
                      </Badge>
                      {c.overrideReason && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          {c.overrideReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {selectedBatch?.status === "READY_FOR_REVIEW" &&
                        !c.isExecuted && (
                          <Select
                            onValueChange={(val) => handleOverride(c.id, val)}
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue placeholder="Override" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PROMOTE">Promote</SelectItem>
                              <SelectItem value="RETAIN">Retain</SelectItem>
                              <SelectItem value="CONDITIONAL">
                                Conditional
                              </SelectItem>
                              <SelectItem value="GRADUATE">Graduate</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      {c.isExecuted && (
                        <span className="text-muted-foreground text-xs">
                          Executed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
