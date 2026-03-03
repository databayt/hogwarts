"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Month calendar view for upcoming exams
import { useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface CalendarExam {
  id: string
  title: string
  examDate: string // ISO date string
  startTime: string
  endTime: string
  duration: number
  examType: string
  className: string
  subjectName: string
  totalMarks: number
}

// Subject colors for exam dots
const SUBJECT_COLORS: Record<string, string> = {}
const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-indigo-500",
]

function getSubjectColor(subjectName: string): string {
  if (!SUBJECT_COLORS[subjectName]) {
    const idx = Object.keys(SUBJECT_COLORS).length % COLOR_PALETTE.length
    SUBJECT_COLORS[subjectName] = COLOR_PALETTE[idx]
  }
  return SUBJECT_COLORS[subjectName]
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  MIDTERM: "Midterm",
  FINAL: "Final",
  QUIZ: "Quiz",
  TEST: "Test",
  ASSIGNMENT: "Assignment",
  HOMEWORK: "Homework",
  PROJECT: "Project",
  PRACTICAL: "Practical",
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarViewProps {
  exams: CalendarExam[]
}

export function CalendarView({ exams }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)

  // Build exam lookup by date
  const examsByDate = new Map<string, CalendarExam[]>()
  for (const exam of exams) {
    const dateKey = exam.examDate.split("T")[0]
    if (!examsByDate.has(dateKey)) examsByDate.set(dateKey, [])
    examsByDate.get(dateKey)!.push(exam)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="text-muted-foreground py-2 text-center text-xs font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {/* Empty cells for days before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px]" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayExams = examsByDate.get(dateKey) || []
            const isPast = isBefore(day, new Date()) && !isToday(day)

            return (
              <div
                key={dateKey}
                className={`min-h-[80px] rounded-md border p-1 ${
                  isToday(day)
                    ? "border-primary bg-primary/5"
                    : isPast
                      ? "bg-muted/30 opacity-60"
                      : "border-transparent"
                }`}
              >
                <div
                  className={`text-end text-xs ${
                    isToday(day)
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>

                {/* Exam dots */}
                <div className="mt-0.5 space-y-0.5">
                  {dayExams.slice(0, 3).map((exam) => (
                    <Popover key={exam.id}>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-accent flex w-full items-center gap-1 truncate rounded px-0.5 py-px text-start">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${getSubjectColor(exam.subjectName)}`}
                          />
                          <span className="truncate text-[10px] leading-tight">
                            {exam.title}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="start">
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium">{exam.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {exam.className} - {exam.subjectName}
                            </p>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {exam.startTime} - {exam.endTime} ({exam.duration}{" "}
                            min)
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {exam.totalMarks} marks
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                  {dayExams.length > 3 && (
                    <span className="text-muted-foreground px-0.5 text-[10px]">
                      +{dayExams.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {exams.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
            {[...new Set(exams.map((e) => e.subjectName))].map((subject) => (
              <div key={subject} className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${getSubjectColor(subject)}`}
                />
                <span className="text-muted-foreground text-xs">{subject}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
