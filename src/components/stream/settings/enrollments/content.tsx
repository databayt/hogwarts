"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
  dictionary: Record<string, any>
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

export function EnrollmentsContent({ dictionary, enrollments }: Props) {
  const d = dictionary?.enrollments

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {d?.title || "Enrollments"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {d?.description || "Manage student enrollments across all subjects"}
          </p>
        </div>
        <Badge variant="outline">
          {enrollments.length} {d?.total || "total"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d?.allEnrollments || "All Enrollments"}</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {d?.noEnrollments || "No enrollments yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.student || "Student"}</TableHead>
                  <TableHead>{d?.email || "Email"}</TableHead>
                  <TableHead>{d?.subject || "Subject"}</TableHead>
                  <TableHead>{d?.status || "Status"}</TableHead>
                  <TableHead className="text-end">
                    {d?.completed || "Completed"}
                  </TableHead>
                  <TableHead>{d?.enrolled || "Enrolled"}</TableHead>
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
                    <TableCell>{enrollment.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[enrollment.status] ?? "outline"}
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      {enrollment.completedLessons} {d?.lessons || "lessons"}
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
