"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns"
import {
  BookOpen,
  Calendar as CalendarIcon,
  CircleAlert,
  Clock,
  MapPin,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Exam {
  id: string
  title: string
  examDate: string | Date
  startTime: string
  endTime: string
  duration: number
  class: { name: string }
  subject: { subjectName: string }
  examType: string
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  totalMarks: number
  passingMarks?: number
}

interface Classroom {
  id: string
  roomNumber: string
  capacity: number
  classroomType?: { name: string }
}

interface ExamCalendarProps {
  exams: Exam[]
  classrooms?: Classroom[]
  onExamClick?: (exam: Exam) => void
  onDateClick?: (date: Date) => void
}

const examTypeColors = {
  MIDTERM: "bg-blue-100 text-blue-800 border-blue-200",
  FINAL: "bg-red-100 text-red-800 border-red-200",
  QUIZ: "bg-green-100 text-green-800 border-green-200",
  TEST: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PRACTICAL: "bg-purple-100 text-purple-800 border-purple-200",
}

const statusColors = {
  PLANNED: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export function ExamCalendar({
  exams,
  classrooms = [],
  onExamClick,
  onDateClick,
}: ExamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month")

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })

    // Add padding for start of week
    const startDay = start.getDay()
    const paddingDays = []
    for (let i = 0; i < startDay; i++) {
      paddingDays.push(null)
    }

    return [...paddingDays, ...days]
  }, [currentDate])

  // Group exams by date
  const examsByDate = useMemo(() => {
    const grouped = new Map<string, Exam[]>()
    exams.forEach((exam) => {
      const date = format(new Date(exam.examDate), "yyyy-MM-dd")
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)?.push(exam)
    })
    return grouped
  }, [exams])

  // Get exams for a specific date
  const getExamsForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      return examsByDate.get(dateStr) || []
    },
    [examsByDate]
  )

  // Check for conflicts
  const hasConflicts = useCallback(
    (date: Date) => {
      const dayExams = getExamsForDate(date)
      for (let i = 0; i < dayExams.length; i++) {
        for (let j = i + 1; j < dayExams.length; j++) {
          const exam1 = dayExams[i]
          const exam2 = dayExams[j]

          // Check time overlap
          const start1 = parseInt(exam1.startTime.replace(":", ""))
          const end1 = parseInt(exam1.endTime.replace(":", ""))
          const start2 = parseInt(exam2.startTime.replace(":", ""))
          const end2 = parseInt(exam2.endTime.replace(":", ""))

          if (
            (start1 <= start2 && end1 > start2) ||
            (start2 <= start1 && end2 > start1)
          ) {
            return true
          }
        }
      }
      return false
    },
    [getExamsForDate]
  )

  const handleDateClick = (date: Date | null) => {
    if (!date) return
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const selectedDateExams = selectedDate ? getExamsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exam Calendar</CardTitle>
              <CardDescription>View and manage scheduled exams</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center">
            <h3 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h3>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-muted-foreground p-2 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2" />
              }

              const dayExams = getExamsForDate(date)
              const hasExams = dayExams.length > 0
              const hasConflict = hasConflicts(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isCurrentMonth = isSameMonth(date, currentDate)

              return (
                <TooltipProvider key={date.toString()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDateClick(date)}
                        className={cn(
                          "relative min-h-[80px] rounded-lg p-2 text-center transition-colors",
                          "hover:bg-muted",
                          isToday(date) && "bg-primary/5 font-semibold",
                          isSelected && "ring-primary ring-2",
                          !isCurrentMonth && "opacity-50"
                        )}
                      >
                        <div className="mb-1 text-sm">{format(date, "d")}</div>

                        {hasExams && (
                          <div className="space-y-1">
                            {/* Show up to 2 exam badges */}
                            {dayExams.slice(0, 2).map((exam, idx) => (
                              <div
                                key={exam.id}
                                className={cn(
                                  "truncate rounded px-1 py-0.5 text-[10px]",
                                  examTypeColors[
                                    exam.examType as keyof typeof examTypeColors
                                  ] || "bg-gray-100"
                                )}
                              >
                                {exam.subject.subjectName}
                              </div>
                            ))}

                            {dayExams.length > 2 && (
                              <div className="text-muted-foreground text-[10px]">
                                +{dayExams.length - 2} more
                              </div>
                            )}
                          </div>
                        )}

                        {hasConflict && (
                          <CircleAlert className="absolute top-1 right-1 h-3 w-3 text-red-500" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="mb-1 font-medium">
                          {format(date, "EEEE, MMMM d")}
                        </div>
                        {dayExams.length > 0 ? (
                          <div>
                            {dayExams.map((exam) => (
                              <div key={exam.id} className="text-xs">
                                {exam.startTime} - {exam.subject.subjectName}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs">
                            No exams scheduled
                          </div>
                        )}
                        {hasConflict && (
                          <div className="mt-1 text-xs text-red-500">
                            ⚠️ Schedule conflict detected
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              <CalendarIcon className="me-2 inline h-4 w-4" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <CardDescription>
              {selectedDateExams.length} exam(s) scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateExams.length > 0 ? (
              <div className="space-y-4">
                {selectedDateExams
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((exam) => (
                    <Card
                      key={exam.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => onExamClick?.(exam)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  examTypeColors[
                                    exam.examType as keyof typeof examTypeColors
                                  ]
                                }
                              >
                                {exam.examType}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={statusColors[exam.status]}
                              >
                                {exam.status}
                              </Badge>
                            </div>

                            <h4 className="font-semibold">{exam.title}</h4>

                            <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.startTime} - {exam.endTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {exam.subject.subjectName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {exam.class.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {/* Room assignment would go here */}
                                Room TBD
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <span>Duration: {exam.duration} mins</span>
                              <span>Total Marks: {exam.totalMarks}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No exams scheduled for this date</p>
                <Button variant="outline" className="mt-4">
                  Schedule New Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
