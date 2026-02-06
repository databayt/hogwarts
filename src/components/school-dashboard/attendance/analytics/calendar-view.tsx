/**
 * Attendance Calendar View Component
 *
 * Displays attendance data in a calendar heatmap format with:
 * - Month view with color-coded days
 * - Click-to-drill into specific dates
 * - Weekly summary statistics
 * - Legend for status colors
 *
 * Inspired by Classter's calendar-based attendance visualization
 */
"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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

// Types
export interface DayAttendance {
  date: string // ISO date string
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  total: number
  rate: number
}

export interface CalendarData {
  month: number
  year: number
  days: DayAttendance[]
  weeklyStats: WeeklyStats[]
}

export interface WeeklyStats {
  weekNumber: number
  startDate: string
  endDate: string
  present: number
  absent: number
  late: number
  total: number
  rate: number
}

interface CalendarViewProps {
  data: CalendarData | null
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onMonthChange: (year: number, month: number) => void
  locale?: string
  isLoading?: boolean
}

// Get color based on attendance rate
function getAttendanceColor(rate: number, total: number): string {
  if (total === 0) return "bg-muted"
  if (rate >= 95) return "bg-green-500 dark:bg-green-600"
  if (rate >= 90) return "bg-green-400 dark:bg-green-500"
  if (rate >= 85) return "bg-yellow-400 dark:bg-yellow-500"
  if (rate >= 80) return "bg-yellow-500 dark:bg-yellow-600"
  if (rate >= 70) return "bg-orange-400 dark:bg-orange-500"
  return "bg-red-500 dark:bg-red-600"
}

// Days of week headers
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAYS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]

export function AttendanceCalendarView({
  data,
  selectedDate,
  onDateSelect,
  onMonthChange,
  locale = "en",
  isLoading = false,
}: CalendarViewProps) {
  const isRTL = locale === "ar"
  const daysOfWeek = isRTL ? DAYS_AR : DAYS_EN

  // Current viewing month/year
  const [viewYear, setViewYear] = React.useState(
    data?.year ?? new Date().getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    data?.month ?? new Date().getMonth()
  )

  // Update view when data changes
  React.useEffect(() => {
    if (data) {
      setViewYear(data.year)
      setViewMonth(data.month)
    }
  }, [data])

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(newDate.getFullYear())
    setViewMonth(newDate.getMonth())
    onMonthChange(newDate.getFullYear(), newDate.getMonth())
  }

  const goToNextMonth = () => {
    const newDate = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(newDate.getFullYear())
    setViewMonth(newDate.getMonth())
    onMonthChange(newDate.getFullYear(), newDate.getMonth())
  }

  const goToToday = () => {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    onMonthChange(today.getFullYear(), today.getMonth())
  }

  // Generate calendar grid
  const generateCalendarDays = React.useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (DayAttendance | null)[] = []

    // Fill empty slots before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Fill actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayData = data?.days.find((d) => d.date === dateStr)
      days.push(
        dayData || {
          date: dateStr,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          sick: 0,
          total: 0,
          rate: 0,
        }
      )
    }

    return days
  }, [viewYear, viewMonth, data])

  // Month name
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(
    isRTL ? "ar-SA" : "en-US",
    { month: "long", year: "numeric" }
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-muted-foreground animate-pulse">
            Loading calendar...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Attendance Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={isRTL ? goToNextMonth : goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center text-sm font-medium">
                {monthName}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={isRTL ? goToPreviousMonth : goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Click on a day to view detailed attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div
            className={cn(
              "mb-2 grid grid-cols-7 gap-1",
              isRTL && "direction-rtl"
            )}
          >
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className="text-muted-foreground py-2 text-center text-xs font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-12" />
                }

                const dateObj = new Date(day.date + "T00:00:00")
                const dayNumber = dateObj.getDate()
                const isSelected =
                  selectedDate?.toDateString() === dateObj.toDateString()
                const isToday =
                  new Date().toDateString() === dateObj.toDateString()
                const hasData = day.total > 0

                return (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onDateSelect(dateObj)}
                        className={cn(
                          "hover:ring-primary relative flex h-12 flex-col items-center justify-center rounded-md border transition-all hover:ring-2",
                          isSelected &&
                            "ring-primary ring-offset-background ring-2 ring-offset-2",
                          isToday && "border-primary border-2",
                          !hasData && "bg-muted/50"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isToday && "text-primary"
                          )}
                        >
                          {dayNumber}
                        </span>
                        {hasData && (
                          <div
                            className={cn(
                              "absolute bottom-1 h-1.5 w-6 rounded-full",
                              getAttendanceColor(day.rate, day.total)
                            )}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-3">
                      <div className="space-y-1.5">
                        <p className="font-medium">
                          {dateObj.toLocaleDateString(
                            isRTL ? "ar-SA" : "en-US",
                            {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                        {hasData ? (
                          <>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              <span>Present: {day.present}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              <span>Absent: {day.absent}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="h-2 w-2 rounded-full bg-yellow-500" />
                              <span>Late: {day.late}</span>
                            </div>
                            <div className="mt-1 border-t pt-1 text-xs font-medium">
                              Rate: {day.rate}%
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground text-xs">
                            No data
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span>95%+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-400" />
              <span>90-94%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-yellow-400" />
              <span>85-89%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-yellow-500" />
              <span>80-84%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-orange-400" />
              <span>70-79%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span>&lt;70%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats Card */}
      {data?.weeklyStats && data.weeklyStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Breakdown</CardTitle>
            <CardDescription>Week by week attendance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.weeklyStats.map((week) => (
                <div
                  key={week.weekNumber}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">Week {week.weekNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(week.startDate).toLocaleDateString(
                        isRTL ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" }
                      )}{" "}
                      -{" "}
                      {new Date(week.endDate).toLocaleDateString(
                        isRTL ? "ar-SA" : "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            week.rate >= 90
                              ? "default"
                              : week.rate >= 80
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {week.rate}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {week.present}/{week.total} present
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Date Detail */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDate.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
              const dayData = data?.days.find((d) => d.date === dateStr)

              if (!dayData || dayData.total === 0) {
                return (
                  <p className="text-muted-foreground text-sm">
                    No attendance data for this date
                  </p>
                )
              }

              return (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dayData.present}
                    </p>
                    <p className="text-muted-foreground text-xs">Present</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {dayData.absent}
                    </p>
                    <p className="text-muted-foreground text-xs">Absent</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {dayData.late}
                    </p>
                    <p className="text-muted-foreground text-xs">Late</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dayData.excused + dayData.sick}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Excused/Sick
                    </p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
