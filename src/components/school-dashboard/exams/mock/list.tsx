"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import { BookOpen, Clock, FileText, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { MockExamItem, MockSubjectFilter } from "./types"

interface MockExamListProps {
  exams: MockExamItem[]
  subjects: MockSubjectFilter[]
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  final: "Final",
  midterm: "Midterm",
  chapter_test: "Chapter Test",
  practice: "Practice",
}

export function MockExamList({ exams, subjects }: MockExamListProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      if (subjectFilter !== "all" && exam.subjectSlug !== subjectFilter)
        return false
      if (typeFilter !== "all" && exam.examType !== typeFilter) return false
      return true
    })
  }, [exams, subjectFilter, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
            <TabsTrigger value="midterm">Midterm</TabsTrigger>
            <TabsTrigger value="chapter_test">Chapter</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No mock exams found matching your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exam) => (
            <Card key={exam.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="line-clamp-2 text-base">
                      {exam.title}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge
                    variant="outline"
                    style={
                      exam.subjectColor
                        ? {
                            borderColor: exam.subjectColor,
                            color: exam.subjectColor,
                          }
                        : undefined
                    }
                  >
                    {exam.subjectName}
                  </Badge>
                  <Badge variant="secondary">
                    {EXAM_TYPE_LABELS[exam.examType] ?? exam.examType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
                  {exam.chapterName && (
                    <div className="col-span-2 flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{exam.chapterName}</span>
                    </div>
                  )}
                  {exam.durationMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.durationMinutes}m
                    </div>
                  )}
                  {exam.totalMarks && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {exam.totalMarks} marks
                    </div>
                  )}
                  {exam.totalQuestions && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {exam.totalQuestions} questions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
