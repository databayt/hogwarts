"use client"

import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EnrollmentRecord } from "./actions"

interface Props {
  dictionary: Record<string, unknown>
  lang: string
  enrollments: EnrollmentRecord[]
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  PENDING: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
}

export function EnrollmentsContent({ enrollments }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enrollments</h1>
          <p className="text-muted-foreground text-sm">
            Manage student enrollments across all subjects
          </p>
        </div>
        <Badge variant="outline">{enrollments.length} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No enrollments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.studentName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {enrollment.studentEmail ?? "—"}
                    </TableCell>
                    <TableCell>{enrollment.subjectName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[enrollment.status] ?? "outline"}
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {enrollment.completedLessons} lessons
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(enrollment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
