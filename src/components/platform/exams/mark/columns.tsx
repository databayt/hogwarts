"use client"

// Marking Dashboard Table Columns

import type { ColumnDef } from "@tanstack/react-table"
import type { MarkingResult, StudentAnswer, Student, QuestionBank } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MARKING_STATUS, GRADING_METHODS, QUESTION_TYPES } from "./config"
import { formatPoints, formatConfidence, getAIConfidenceIndicator } from "./utils"
import { Eye, Edit, CheckCircle } from "lucide-react"

type MarkingQueueItem = StudentAnswer & {
  student: Student
  question: QuestionBank
  markingResult?: MarkingResult | null
}

export function getColumns(dictionary: Dictionary): ColumnDef<MarkingQueueItem>[] {
  const dict = dictionary.marking
  return [
    {
      accessorKey: "student",
      header: dict.table.student,
      cell: ({ row }) => {
        const student = row.original.student
        const fullName = `${student.givenName} ${student.middleName || ''} ${student.surname}`.trim().replace(/\s+/g, ' ')
        return (
          <div className="font-medium">
            {fullName}
          </div>
        )
      },
    },
    {
      accessorKey: "question",
      header: dict.table.question,
      cell: ({ row }) => {
        const question = row.original.question
        const questionType = question.questionType as keyof typeof dict.questionTypes
        const difficulty = question.difficulty.toLowerCase() as keyof typeof dict.difficulty

        return (
          <div className="max-w-md">
            <p className="truncate text-sm">{question.questionText}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {dict.questionTypes[questionType]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {dict.difficulty[difficulty]}
              </Badge>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "submissionType",
      header: dict.table.type,
      cell: ({ row }) => {
        const type = row.original.submissionType.toLowerCase() as keyof typeof dict.submissionTypes
        return (
          <Badge variant="secondary" className="capitalize">
            {dict.submissionTypes[type]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "markingResult",
      header: dict.table.status,
      cell: ({ row }) => {
        const result = row.original.markingResult
        if (!result) {
          return <Badge variant="outline">{dict.status.notStarted}</Badge>
        }

        const statusKey = result.status.toLowerCase().replace("_", "") as keyof typeof dict.status
        const config = MARKING_STATUS[result.status]
        return (
          <Badge variant="outline" className={config.color}>
            {dict.status[statusKey] || config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "score",
      header: dict.table.score,
      cell: ({ row }) => {
        const result = row.original.markingResult
        if (!result) return <span className="text-muted-foreground">-</span>

        return (
          <div>
            <p className="font-medium">
              {formatPoints(Number(result.pointsAwarded), Number(result.maxPoints))}
            </p>
            {result.aiConfidence && (
              <p className="text-xs text-muted-foreground">
                AI: {formatConfidence(result.aiConfidence)}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "method",
      header: dict.table.method,
      cell: ({ row }) => {
        const result = row.original.markingResult
        if (!result) return <span className="text-muted-foreground">-</span>

        const methodKey = result.gradingMethod.toLowerCase().replace("_", "") as keyof typeof dict.gradingMethods
        return (
          <Badge variant="secondary" className="text-xs">
            {dict.gradingMethods[methodKey] || GRADING_METHODS[result.gradingMethod].label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "needsReview",
      header: dict.table.review,
      cell: ({ row }) => {
        const result = row.original.markingResult
        if (!result || !result.needsReview) return null

        return (
          <Badge variant="destructive" className="text-xs">
            {dict.aiGrading.needsReview}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: dict.table.actions,
      cell: ({ row }) => {
        const result = row.original.markingResult

        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to grading interface
                window.location.href = `/mark/grade/${row.original.id}`
              }}
            >
              {result?.status === "COMPLETED" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
            {result && result.status !== "COMPLETED" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Mark as reviewed
                  // TODO: Implement mark as reviewed action
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
