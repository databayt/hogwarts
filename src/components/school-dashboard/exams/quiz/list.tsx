"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import { BookOpen, Clock, FileText, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { QuizItem, QuizQuestionStats, QuizSubjectFilter } from "./types"

const QUIZ_TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  diagnostic: "Diagnostic",
}

interface QuizListProps {
  quizzes: QuizItem[]
  subjects: QuizSubjectFilter[]
  questionStats: QuizQuestionStats[]
}

export function QuizList({ quizzes, subjects, questionStats }: QuizListProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      if (subjectFilter !== "all" && q.subjectSlug !== subjectFilter)
        return false
      if (typeFilter !== "all" && q.examType !== typeFilter) return false
      return true
    })
  }, [quizzes, subjectFilter, typeFilter])

  const filteredStats = useMemo(() => {
    if (subjectFilter === "all") return questionStats
    const subject = subjects.find((s) => s.slug === subjectFilter)
    if (!subject) return questionStats
    return questionStats.filter((s) => s.catalogSubjectId === subject.id)
  }, [questionStats, subjectFilter, subjects])

  return (
    <div className="space-y-6">
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
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No quizzes match the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-2 text-base">
                    {quiz.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      style={
                        quiz.subjectColor
                          ? {
                              backgroundColor: `${quiz.subjectColor}20`,
                              color: quiz.subjectColor,
                              borderColor: `${quiz.subjectColor}40`,
                            }
                          : undefined
                      }
                    >
                      {quiz.subjectName}
                    </Badge>
                    <Badge variant="outline">
                      {QUIZ_TYPE_LABELS[quiz.examType] ?? quiz.examType}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(quiz.chapterName || quiz.lessonName) && (
                  <p className="text-muted-foreground mb-3 line-clamp-1 text-sm">
                    {[quiz.chapterName, quiz.lessonName]
                      .filter(Boolean)
                      .join(" → ")}
                  </p>
                )}
                <div className="text-muted-foreground grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{quiz.durationMinutes ?? "—"}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{quiz.totalQuestions ?? "—"}Q</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{quiz.totalMarks ?? "—"}pts</span>
                  </div>
                </div>
                {quiz.usageCount > 0 && (
                  <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <BookOpen className="h-3 w-3" />
                    <span>Used {quiz.usageCount} times</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Question Pool by Subject</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {filteredStats.map((stat) => {
              const maxQuestions = Math.max(
                ...filteredStats.map((s) => s.totalQuestions)
              )
              return (
                <Card key={stat.catalogSubjectId}>
                  <CardContent className="pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {stat.subjectName}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {stat.totalQuestions} questions
                      </span>
                    </div>
                    <Progress
                      value={(stat.totalQuestions / maxQuestions) * 100}
                      className="h-2"
                    />
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
                      {Object.entries(stat.byDifficulty).map(
                        ([level, count]) => (
                          <span key={level}>
                            {level}: {count}
                          </span>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
