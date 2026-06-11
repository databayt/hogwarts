// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getChildAssignments } from "./actions"

interface Props {
  studentId: string
  lang?: Locale
  dictionary?: Dictionary
}

export async function ChildAssignmentsView({
  studentId,
  lang = "ar",
  dictionary,
}: Props) {
  const t = dictionary?.parentPortal?.assignments
  const { assignments } = await getChildAssignments({ studentId })

  const getStatusBadge = (assignment: (typeof assignments)[0]) => {
    if (!assignment.submission) {
      const dueDate = new Date(assignment.dueDate)
      const now = new Date()
      if (dueDate < now) {
        return (
          <Badge variant="destructive">{t?.statusMissing ?? "Missing"}</Badge>
        )
      }
      return (
        <Badge variant="outline">
          {t?.statusNotSubmitted ?? "Not Submitted"}
        </Badge>
      )
    }

    switch (assignment.submission.status) {
      case "SUBMITTED":
        return (
          <Badge variant="default">{t?.statusSubmitted ?? "Submitted"}</Badge>
        )
      case "GRADED":
        return (
          <Badge variant="default" className="bg-green-600">
            {t?.statusGraded ?? "Graded"}
          </Badge>
        )
      case "LATE_SUBMITTED":
        return <Badge variant="destructive">{t?.statusLate ?? "Late"}</Badge>
      case "DRAFT":
        return <Badge variant="outline">{t?.statusDraft ?? "Draft"}</Badge>
      case "RETURNED":
        return (
          <Badge variant="default">{t?.statusReturned ?? "Returned"}</Badge>
        )
      default:
        return <Badge variant="outline">{assignment.submission.status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t?.title ?? "Assignments"}</CardTitle>
          <CardDescription>
            {assignments.length > 0
              ? (t?.showing?.replace("{count}", String(assignments.length)) ??
                `Showing ${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`)
              : (t?.noneAvailable ?? "No assignments available")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {t?.noneAssigned ?? "No assignments assigned yet"}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t?.colTitle ?? "Title"}</TableHead>
                    <TableHead>{t?.colSubject ?? "Subject"}</TableHead>
                    <TableHead>{t?.colClass ?? "Class"}</TableHead>
                    <TableHead>
                      {t?.colAssignedDate ?? "Assigned Date"}
                    </TableHead>
                    <TableHead>{t?.colDueDate ?? "Due Date"}</TableHead>
                    <TableHead className="w-[120px]">
                      {t?.colPoints ?? "Points"}
                    </TableHead>
                    <TableHead className="w-[120px]">
                      {t?.colGrade ?? "Grade"}
                    </TableHead>
                    <TableHead className="w-[120px]">
                      {t?.colStatus ?? "Status"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const dueDate = new Date(assignment.dueDate)
                    const publishDate = assignment.publishDate
                      ? new Date(assignment.publishDate)
                      : null
                    const now = new Date()
                    const isOverdue = !assignment.submission && dueDate < now

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            {assignment.description && (
                              <p className="text-muted-foreground line-clamp-1 text-sm">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.name}</TableCell>
                        <TableCell>{assignment.className}</TableCell>
                        <TableCell>
                          {publishDate ? formatDate(publishDate, lang) : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              isOverdue ? "text-destructive font-medium" : ""
                            }
                          >
                            {formatDate(dueDate, lang)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {assignment.totalPoints} {t?.points ?? "pts"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {assignment.submission?.score !== null &&
                          assignment.submission?.score !== undefined ? (
                            <span className="font-medium">
                              {assignment.submission.score}/
                              {assignment.totalPoints}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
