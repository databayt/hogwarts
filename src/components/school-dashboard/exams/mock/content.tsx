// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BookOpen, Clock, FileText, GraduationCap } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getCatalogSubjectsForMockFilter, getMockExams } from "./actions"
import { MockExamList } from "./list"

export async function MockContent() {
  const [exams, subjects] = await Promise.all([
    getMockExams(),
    getCatalogSubjectsForMockFilter(),
  ])

  const avgDuration =
    exams.length > 0
      ? Math.round(
          exams.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0) /
            exams.filter((e) => e.durationMinutes).length || 0
        )
      : 0

  const totalQuestions = exams.reduce(
    (sum, e) => sum + (e.totalQuestions ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mock Exams</h2>
        <p className="text-muted-foreground">
          Browse practice exams from the catalog by subject and chapter
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-muted-foreground text-xs">
              Available mock exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-muted-foreground text-xs">Across subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration}m</div>
            <p className="text-muted-foreground text-xs">
              Average exam duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-muted-foreground text-xs">
              Total questions across exams
            </p>
          </CardContent>
        </Card>
      </div>

      <MockExamList exams={exams} subjects={subjects} />
    </div>
  )
}

export default MockContent
