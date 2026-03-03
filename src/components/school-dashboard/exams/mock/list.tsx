"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Clock, FileText, Play, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { MockExamItem, MockSubjectFilter, SchoolMockItem } from "./types"

interface MockExamListProps {
  exams: MockExamItem[]
  subjects: MockSubjectFilter[]
  schoolMocks?: SchoolMockItem[]
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  final: "Final",
  midterm: "Midterm",
  chapter_test: "Chapter Test",
  practice: "Practice",
}

export function MockExamList({
  exams,
  subjects,
  schoolMocks = [],
}: MockExamListProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [mockSource, setMockSource] = useState<string>("catalog")

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
      {/* Source tabs: Catalog vs School Mocks */}
      {schoolMocks.length > 0 && (
        <Tabs value={mockSource} onValueChange={setMockSource}>
          <TabsList>
            <TabsTrigger value="catalog">Catalog ({exams.length})</TabsTrigger>
            <TabsTrigger value="school">
              School ({schoolMocks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {mockSource === "school" && schoolMocks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schoolMocks.map((mock) => (
            <Card key={mock.id}>
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-base">
                  {mock.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {mock.subjectName && (
                    <Badge variant="outline">{mock.subjectName}</Badge>
                  )}
                  {mock.className && (
                    <Badge variant="secondary">{mock.className}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {mock.totalQuestions} questions
                  </div>
                  {mock.templateName && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{mock.templateName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                >
                  <Link href={`exams/${mock.examId}/take`}>
                    <Play className="h-3.5 w-3.5" />
                    Start Mock
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
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
                          <span className="line-clamp-1">
                            {exam.chapterName}
                          </span>
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
                  <CardFooter className="pt-0">
                    <Button asChild size="sm" className="w-full gap-1">
                      <Link href={`mock/${exam.id}/take`}>
                        <Play className="h-3.5 w-3.5" />
                        Start Mock
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
