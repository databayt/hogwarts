"use client"

import { useMemo, useState, useTransition } from "react"
import useSWR from "swr"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { getContributionData } from "./contribution-actions"
import type {
  ActivityDataPoint,
  ContributionDataPoint,
  ContributionGraphData,
  ProfileRole,
} from "./types"

// ============================================================================
// Props
// ============================================================================

interface ActivityGraphProps {
  role: ProfileRole
  userId?: string
  isOwner?: boolean
  initialData?: ContributionGraphData
}

// ============================================================================
// Constants
// ============================================================================

/**
 * GitHub-inspired Contribution Graph Colors
 *
 * EXCEPTION: This component uses exact GitHub colors for data visualization
 * authenticity. The colors are defined as CSS custom properties in globals.css
 * and are documented in .claude/skills/ui-validator.md under "Exceptions".
 *
 * Light mode: #ebedf0 -> #9be9a8 -> #40c463 -> #30a14e -> #216e39
 * Dark mode:  #161b22 -> #0e4429 -> #006d32 -> #26a641 -> #39d353
 */
const LEVEL_STYLES: Record<number, React.CSSProperties> = {
  0: { backgroundColor: "var(--contribution-level-0)" },
  1: { backgroundColor: "var(--contribution-level-1)" },
  2: { backgroundColor: "var(--contribution-level-2)" },
  3: { backgroundColor: "var(--contribution-level-3)" },
  4: { backgroundColor: "var(--contribution-level-4)" },
}

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

const WEEKDAYS = ["Sun", "", "Mon", "", "Wed", "", "Fri", ""]

const ROLE_LABELS: Record<ProfileRole, string> = {
  student: "activities",
  teacher: "activities",
  parent: "interactions",
  staff: "tasks",
}

// ============================================================================
// Mock Data Generator (Fallback)
// ============================================================================

function generateMockData(
  role: ProfileRole,
  year: number
): ContributionGraphData {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  const contributions: ContributionDataPoint[] = []
  const current = new Date(startDate)

  // Adjust start to Sunday of that week
  const startDayOfWeek = current.getDay()
  current.setDate(current.getDate() - startDayOfWeek)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    const month = current.getMonth()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isSchoolMonth = month >= 8 || month <= 5
    const isVacation = month === 6 || month === 7

    let baseIntensity = Math.random()

    // Adjust intensity based on realistic patterns
    if (isWeekend) baseIntensity *= 0.3
    if (!isSchoolMonth || isVacation) baseIntensity *= 0.2

    // Role-specific patterns
    if (role === "teacher" && dayOfWeek >= 1 && dayOfWeek <= 5)
      baseIntensity *= 1.2
    if (role === "parent" && dayOfWeek === 3) baseIntensity *= 0.8
    if (role === "student" && dayOfWeek === 2) baseIntensity *= 1.3

    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (baseIntensity > 0.8) level = 4
    else if (baseIntensity > 0.6) level = 3
    else if (baseIntensity > 0.4) level = 2
    else if (baseIntensity > 0.15) level = 1

    const count = Math.floor(baseIntensity * 10)

    contributions.push({
      date: current.toISOString().split("T")[0],
      level,
      count,
      activities: [],
    })

    current.setDate(current.getDate() + 1)
  }

  const totalActivities = contributions.reduce((sum, c) => sum + c.count, 0)

  return {
    contributions,
    totalActivities,
    year,
    role,
    summary: {
      activeDays: contributions.filter((c) => c.count > 0).length,
      longestStreak: 0,
      currentStreak: 0,
      averagePerDay: 0,
      peakDay: null,
    },
  }
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getDateMonth(dateStr: string): number {
  return new Date(dateStr).getMonth()
}

// ============================================================================
// Component
// ============================================================================

export default function ActivityGraph({
  role = "student",
  userId,
  isOwner = false,
  initialData,
}: ActivityGraphProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  // Fetch real data with SWR
  const {
    data: fetchedData,
    error,
    isLoading,
  } = useSWR(
    userId ? ["contribution-data", userId, selectedYear] : null,
    async () => {
      const result = await getContributionData({
        userId,
        year: parseInt(selectedYear),
      })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  // Use fetched data, fallback to mock
  const graphData = useMemo(() => {
    if (fetchedData) return fetchedData
    return generateMockData(role, parseInt(selectedYear))
  }, [fetchedData, role, selectedYear])

  // Group data into weeks (columns)
  const weeks = useMemo(() => {
    const result: ContributionDataPoint[][] = []
    let currentWeek: ContributionDataPoint[] = []

    graphData.contributions.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      // Pad the last week with empty slots
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date().toISOString().split("T")[0],
          level: 0,
          count: 0,
          activities: [],
        })
      }
      result.push(currentWeek)
    }

    return result
  }, [graphData.contributions])

  // Calculate month positions for labels
  const monthPositions = useMemo(() => {
    const positions: { month: string; position: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIdx) => {
      const firstDayWithData = week.find((d) => d.count >= 0)
      if (firstDayWithData) {
        const month = getDateMonth(firstDayWithData.date)
        if (month !== lastMonth) {
          positions.push({
            month: MONTHS[month],
            position: weekIdx,
          })
          lastMonth = month
        }
      }
    })

    return positions
  }, [weeks])

  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  )

  const roleLabel = ROLE_LABELS[role]

  // Loading state
  if (isLoading && !graphData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[140px] w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-base font-semibold">
            {graphData.totalActivities.toLocaleString()} {roleLabel} in{" "}
            {selectedYear}
          </h3>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year} className="text-xs">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error indicator (subtle) */}
        {error && (
          <p className="text-muted-foreground text-xs">
            Unable to load real data. Showing sample activity.
          </p>
        )}

        {/* Graph Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-max">
            {/* Month labels */}
            <div className="ms-10 mb-1 flex">
              {monthPositions.map(({ month, position }, idx) => (
                <span
                  key={idx}
                  className="text-muted-foreground text-[10px]"
                  style={{
                    marginInlineStart:
                      idx === 0
                        ? `${position * 13}px`
                        : `${(position - (monthPositions[idx - 1]?.position || 0) - 1) * 13}px`,
                    minWidth: "26px",
                  }}
                >
                  {month}
                </span>
              ))}
            </div>

            {/* Graph Grid */}
            <div className="flex">
              {/* Weekday labels */}
              <div className="text-muted-foreground me-2 flex flex-col gap-[3px] text-[10px]">
                {WEEKDAYS.map((day, idx) => (
                  <span key={idx} className="h-[10px] leading-[10px]">
                    {day}
                  </span>
                ))}
              </div>

              {/* Contribution grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => (
                      <Tooltip key={`${weekIdx}-${dayIdx}`}>
                        <TooltipTrigger asChild>
                          <div
                            className="hover:ring-foreground/20 size-[11px] cursor-pointer rounded-[3px] transition-all hover:ring-1"
                            style={LEVEL_STYLES[day.level]}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm">
                            <p className="font-semibold">
                              {day.count > 0
                                ? `${day.count} ${roleLabel}`
                                : `No ${roleLabel}`}
                            </p>
                            <p className="text-muted-foreground">
                              {formatDate(day.date)}
                            </p>
                            {day.activities && day.activities.length > 0 && (
                              <div className="border-border mt-1 border-t pt-1">
                                {day.activities.map((activity, i) => (
                                  <p
                                    key={i}
                                    className="text-muted-foreground text-xs"
                                  >
                                    • {activity.label} ({activity.count})
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <a href="#" className="hover:text-primary transition-colors">
            Learn how we count {roleLabel}
          </a>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="flex gap-[2px]">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="size-[11px] rounded-[3px]"
                  style={LEVEL_STYLES[level]}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
