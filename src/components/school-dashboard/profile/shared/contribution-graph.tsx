/**
 * Contribution Graph Component
 * GitHub-style activity heatmap showing daily contributions
 */

"use client"

import React, { useMemo, useState } from "react"
import { addDays, format, isSameMonth, isToday, startOfWeek } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ContributionData, DailyContribution } from "../types"

// ============================================================================
// Types
// ============================================================================

interface ContributionGraphProps {
  data: ContributionData
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
  onDayClick?: (date: string) => void
}

interface ContributionLevel {
  level: 0 | 1 | 2 | 3 | 4
  color: string
  label: string
  min: number
}

// ============================================================================
// Constants
// ============================================================================

const CONTRIBUTION_LEVELS: ContributionLevel[] = [
  { level: 0, color: "bg-muted", label: "No activity", min: 0 },
  { level: 1, color: "bg-chart-1/30", label: "Low activity", min: 1 },
  { level: 2, color: "bg-chart-1/50", label: "Moderate activity", min: 3 },
  { level: 3, color: "bg-chart-1/70", label: "High activity", min: 6 },
  { level: 4, color: "bg-chart-1", label: "Very high activity", min: 10 },
]

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]

// ============================================================================
// Utility Functions
// ============================================================================

function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count < 3) return 1
  if (count < 6) return 2
  if (count < 10) return 3
  return 4
}

function generateEmptyYear(): DailyContribution[] {
  const contributions: DailyContribution[] = []
  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  let currentDate = oneYearAgo
  while (currentDate <= today) {
    contributions.push({
      date: format(currentDate, "yyyy-MM-dd"),
      count: 0,
      level: 0,
    })
    currentDate = addDays(currentDate, 1)
  }

  return contributions
}

function mergeContributions(
  emptyYear: DailyContribution[],
  actualData: DailyContribution[]
): DailyContribution[] {
  const dataMap = new Map(actualData.map((d) => [d.date, d]))

  return emptyYear.map((day) => {
    const actual = dataMap.get(day.date)
    if (actual) {
      return {
        ...actual,
        level: getContributionLevel(actual.count),
      }
    }
    return day
  })
}

function groupContributionsByWeek(contributions: DailyContribution[]) {
  const weeks: DailyContribution[][] = []
  let currentWeek: DailyContribution[] = []

  contributions.forEach((contribution, index) => {
    const date = new Date(contribution.date)
    const dayOfWeek = date.getDay()

    if (index === 0 && dayOfWeek !== 0) {
      // Add empty cells for the first week
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({
          date: "",
          count: 0,
          level: 0,
          details: undefined,
        })
      }
    }

    currentWeek.push(contribution)

    if (dayOfWeek === 6 || index === contributions.length - 1) {
      // Complete the last week with empty cells if needed
      if (dayOfWeek !== 6) {
        for (let i = dayOfWeek + 1; i <= 6; i++) {
          currentWeek.push({
            date: "",
            count: 0,
            level: 0,
            details: undefined,
          })
        }
      }
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  return weeks
}

// ============================================================================
// Component
// ============================================================================

export function ContributionGraph({
  data,
  dictionary,
  lang = "en",
  className,
  onDayClick,
}: ContributionGraphProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const locale = lang === "ar" ? ar : enUS

  // Generate contribution grid
  const contributionGrid = useMemo(() => {
    const emptyYear = generateEmptyYear()
    const merged = mergeContributions(emptyYear, data.contributions)
    return groupContributionsByWeek(merged)
  }, [data.contributions])

  // Calculate months for the header
  const months = useMemo(() => {
    const monthLabels: { label: string; colSpan: number }[] = []
    let currentMonth = -1
    let colSpan = 0

    contributionGrid.forEach((week) => {
      const firstValidDay = week.find((day) => day.date)
      if (firstValidDay) {
        const date = new Date(firstValidDay.date)
        const month = date.getMonth()
        if (month !== currentMonth) {
          if (currentMonth !== -1) {
            monthLabels.push({
              label:
                lang === "ar" ? MONTHS_AR[currentMonth] : MONTHS[currentMonth],
              colSpan,
            })
          }
          currentMonth = month
          colSpan = 1
        } else {
          colSpan++
        }
      } else {
        colSpan++
      }
    })

    // Add the last month
    if (currentMonth !== -1) {
      monthLabels.push({
        label: lang === "ar" ? MONTHS_AR[currentMonth] : MONTHS[currentMonth],
        colSpan,
      })
    }

    return monthLabels
  }, [contributionGrid, lang])

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i)
    }
    return years
  }, [])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {data.totalContributions} contributions in the last year
          </CardTitle>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Contribution Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Month labels */}
              <div className="ms-[30px] mb-1 flex gap-[3px]">
                {months.map((month, index) => (
                  <div
                    key={index}
                    className="text-muted-foreground text-xs"
                    style={{ width: `${month.colSpan * 13}px` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="flex gap-[3px]">
                {/* Day labels */}
                <div className="me-1 flex flex-col gap-[3px]">
                  <div className="h-[11px]" /> {/* Spacer for first row */}
                  {[1, 3, 5].map((dayIndex) => (
                    <div
                      key={dayIndex}
                      className="text-muted-foreground h-[11px] text-xs"
                    >
                      <span className="text-[10px]">
                        {lang === "ar"
                          ? DAYS_AR[dayIndex][0]
                          : DAYS[dayIndex].slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Contribution cells */}
                <div className="flex gap-[3px]">
                  {contributionGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                      {week.map((day, dayIndex) => {
                        if (!day.date) {
                          return (
                            <div key={dayIndex} className="h-[11px] w-[11px]" />
                          )
                        }

                        const date = new Date(day.date)
                        const formattedDate = format(date, "MMM d, yyyy", {
                          locale,
                        })
                        const isCurrentDay = isToday(date)

                        return (
                          <TooltipProvider key={dayIndex}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className={cn(
                                    "h-[11px] w-[11px] rounded-sm border transition-all",
                                    CONTRIBUTION_LEVELS[day.level].color,
                                    isCurrentDay &&
                                      "ring-primary ring-1 ring-offset-1",
                                    "hover:ring-primary hover:ring-1 hover:ring-offset-1",
                                    "focus:ring-primary focus:ring-1 focus:ring-offset-1 focus:outline-none"
                                  )}
                                  onClick={() => onDayClick?.(day.date)}
                                  aria-label={`${day.count} contributions on ${formattedDate}`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-medium">
                                    {day.count} contributions
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formattedDate}
                                  </p>
                                  {day.details && (
                                    <div className="mt-1 border-t pt-1">
                                      {day.details.assignments && (
                                        <p>
                                          Assignments: {day.details.assignments}
                                        </p>
                                      )}
                                      {day.details.attendance && (
                                        <p>
                                          Attendance: {day.details.attendance}
                                        </p>
                                      )}
                                      {day.details.activities && (
                                        <p>
                                          Activities: {day.details.activities}
                                        </p>
                                      )}
                                      {day.details.achievements && (
                                        <p>
                                          Achievements:{" "}
                                          {day.details.achievements}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Less</span>
                <div className="flex gap-[3px]">
                  {CONTRIBUTION_LEVELS.map((level) => (
                    <TooltipProvider key={level.level}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-[11px] w-[11px] rounded-sm border",
                              level.color
                            )}
                            aria-label={level.label}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{level.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">More</span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
            <div>
              <p className="text-2xl font-semibold">
                {data.totalContributions}
              </p>
              <p className="text-muted-foreground text-xs">
                Total contributions
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data.currentStreak}</p>
              <p className="text-muted-foreground text-xs">Current streak</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{data.longestStreak}</p>
              <p className="text-muted-foreground text-xs">Longest streak</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {(data.totalContributions / 365).toFixed(1)}
              </p>
              <p className="text-muted-foreground text-xs">Daily average</p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {data.monthlyStats && data.monthlyStats.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium">Monthly Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {data.monthlyStats.slice(-4).map((month, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(month.month + "-01"), "MMM yyyy", {
                        locale,
                      })}
                    </p>
                    <p className="font-medium">{month.totalContributions}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Academic</span>
                        <span>{month.categories.academic}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Extra</span>
                        <span>{month.categories.extracurricular}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
