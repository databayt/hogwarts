"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { updateContributionVisibility } from "./contribution-actions"

// ============================================================================
// Types
// ============================================================================

interface SubjectRef {
  id: string
  name: string
}

interface CatalogQuestionContribution {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
  visibility: "PRIVATE" | "SCHOOL" | "PUBLIC"
  createdAt: Date | string
  catalogSubject: SubjectRef | null
}

interface CatalogMaterialContribution {
  id: string
  title: string
  type: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
  visibility: "PRIVATE" | "SCHOOL" | "PUBLIC"
  createdAt: Date | string
  catalogSubject: SubjectRef | null
}

interface CatalogAssignmentContribution {
  id: string
  title: string
  assignmentType: string | null
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
  visibility: "PRIVATE" | "SCHOOL" | "PUBLIC"
  createdAt: Date | string
  catalogSubject: SubjectRef | null
}

interface Props {
  contributions: {
    questions: CatalogQuestionContribution[]
    materials: CatalogMaterialContribution[]
    assignments: CatalogAssignmentContribution[]
  }
}

// ============================================================================
// Status badge helper
// ============================================================================

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs", STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}

// ============================================================================
// Visibility dropdown
// ============================================================================

const VISIBILITY_OPTIONS = ["PRIVATE", "SCHOOL", "PUBLIC"] as const

function VisibilityToggle({
  type,
  id,
  current,
  disabled,
}: {
  type: "question" | "material" | "assignment"
  id: string
  current: string
  disabled: boolean
}) {
  const [isPending, startTransition] = useTransition()

  const handleChange = useCallback(
    (visibility: "PRIVATE" | "SCHOOL" | "PUBLIC") => {
      if (visibility === current) return
      startTransition(async () => {
        try {
          await updateContributionVisibility(type, id, visibility)
          toast.success("Visibility updated")
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update visibility"
          )
        }
      })
    },
    [type, id, current]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isPending}>
        <Badge
          variant="secondary"
          className="cursor-pointer text-xs hover:opacity-80"
        >
          {isPending ? "..." : current}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {VISIBILITY_OPTIONS.map((v) => (
          <DropdownMenuItem
            key={v}
            onClick={() => handleChange(v)}
            className={cn(v === current && "font-semibold")}
          >
            {v}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Date formatting helper
// ============================================================================

function formatDate(date: Date | string): string {
  try {
    return format(new Date(date), "MMM d, yyyy")
  } catch {
    return "-"
  }
}

// ============================================================================
// Component
// ============================================================================

export function MyContributions({ contributions }: Props) {
  const { questions, materials, assignments } = contributions

  const questionCount = questions.length
  const materialCount = materials.length
  const assignmentCount = assignments.length
  const totalCount = questionCount + materialCount + assignmentCount

  if (totalCount === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        You have not contributed any content yet.
      </p>
    )
  }

  return (
    <Tabs defaultValue="questions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="questions">Questions ({questionCount})</TabsTrigger>
        <TabsTrigger value="materials">Materials ({materialCount})</TabsTrigger>
        <TabsTrigger value="assignments">
          Assignments ({assignmentCount})
        </TabsTrigger>
      </TabsList>

      {/* Questions Tab */}
      <TabsContent value="questions">
        {questions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No questions contributed yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-[300px] truncate font-medium">
                      {q.questionText}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {q.catalogSubject?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {q.questionType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={q.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <VisibilityToggle
                        type="question"
                        id={q.id}
                        current={q.visibility}
                        disabled={q.approvalStatus !== "APPROVED"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(q.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* Materials Tab */}
      <TabsContent value="materials">
        {materials.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No materials contributed yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-[300px] truncate font-medium">
                      {m.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.catalogSubject?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {m.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <VisibilityToggle
                        type="material"
                        id={m.id}
                        current={m.visibility}
                        disabled={m.approvalStatus !== "APPROVED"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(m.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* Assignments Tab */}
      <TabsContent value="assignments">
        {assignments.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No assignments contributed yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[300px] truncate font-medium">
                      {a.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.catalogSubject?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {a.assignmentType ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <VisibilityToggle
                        type="assignment"
                        id={a.id}
                        current={a.visibility}
                        disabled={a.approvalStatus !== "APPROVED"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(a.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
