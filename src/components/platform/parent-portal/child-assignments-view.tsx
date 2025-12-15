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

import { getChildAssignments } from "./actions"

interface Props {
  studentId: string
}

export async function ChildAssignmentsView({ studentId }: Props) {
  const { assignments } = await getChildAssignments({ studentId })

  const getStatusBadge = (assignment: (typeof assignments)[0]) => {
    if (!assignment.submission) {
      const dueDate = new Date(assignment.dueDate)
      const now = new Date()
      if (dueDate < now) {
        return <Badge variant="destructive">Missing</Badge>
      }
      return <Badge variant="outline">Not Submitted</Badge>
    }

    switch (assignment.submission.status) {
      case "SUBMITTED":
        return <Badge variant="default">Submitted</Badge>
      case "GRADED":
        return (
          <Badge variant="default" className="bg-green-600">
            Graded
          </Badge>
        )
      case "LATE_SUBMITTED":
        return <Badge variant="destructive">Late</Badge>
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>
      case "RETURNED":
        return <Badge variant="default">Returned</Badge>
      default:
        return <Badge variant="outline">{assignment.submission.status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>
            {assignments.length > 0
              ? `Showing ${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`
              : "No assignments available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No assignments assigned yet
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[120px]">Points</TableHead>
                    <TableHead className="w-[120px]">Grade</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
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
                        <TableCell>{assignment.subjectName}</TableCell>
                        <TableCell>{assignment.className}</TableCell>
                        <TableCell>
                          {publishDate?.toLocaleDateString() || "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              isOverdue ? "text-destructive font-medium" : ""
                            }
                          >
                            {dueDate.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {assignment.totalPoints} pts
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
