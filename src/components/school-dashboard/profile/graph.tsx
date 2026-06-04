"use client"

import { useMemo, useState, useTransition } from "react"
import useSWR from "swr"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { getContributionData } from "./actions"
import type {
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
  dictionary?: Record<string, any>
  lang?: string
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

const ROLE_LABEL_KEYS: Record<ProfileRole, string> = {
  student: "activities",
  teacher: "activities",
  parent: "interactions",
  staff: "tasks",
}

// ============================================================================
// Empty Graph Builder (real data absent → render an honest, empty grid)
// ============================================================================

function buildEmptyGraph(
  role: ProfileRole,
  year: number
): ContributionGraphData {
  const endDate = new Date(year, 11, 31)
  const contributions: ContributionDataPoint[] = []
  const current = new Date(year, 0, 1)

  // Align the grid to the Sunday of the first week.
  current.setDate(current.getDate() - current.getDay())

  while (current <= endDate) {
    contributions.push({
      date: current.toISOString().split("T")[0],
      level: 0,
      count: 0,
      activities: [],
    })
    current.setDate(current.getDate() + 1)
  }

  return {
    contributions,
    totalActivities: 0,
    year,
    role,
    summary: {
      activeDays: 0,
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

function formatDate(dateStr: string, locale: string = "en"): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
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
  dictionary,
  lang,
}: ActivityGraphProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const locale = lang === "ar" ? "ar" : "en"
  const p = dictionary

  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" })
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(2024, i, 1))
    )
  }, [locale])

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
    const getDay = (d: number) => formatter.format(new Date(2024, 0, 7 + d))
    return [getDay(0), "", getDay(1), "", getDay(3), "", getDay(5), ""]
  }, [locale])

  const roleLabel = p?.graph?.[ROLE_LABEL_KEYS[role]] ?? ROLE_LABEL_KEYS[role]

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

  // Use real data; render an empty (zero-filled) grid when absent — never mock.
  const graphData = useMemo(() => {
    if (fetchedData) return fetchedData
    return buildEmptyGraph(role, parseInt(selectedYear))
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
            month: months[month],
            position: weekIdx,
          })
          lastMonth = month
        }
      }
    })

    return positions
  }, [weeks, months])

  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  )

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
      <div>
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
                {weekdays.map((day: string, idx: number) => (
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
                                : (p?.graph?.noContributions ??
                                  "No contributions")}
                            </p>
                            <p className="text-muted-foreground">
                              {formatDate(day.date, locale)}
                            </p>
                            {day.activities && day.activities.length > 0 && (
                              <div className="border-border mt-1 border-t pt-1">
                                {day.activities.map((activity, i) => (
                                  <p
                                    key={i}
                                    className="text-muted-foreground text-xs"
                                  >
                                    •{" "}
                                    {p?.overview?.activityLabels?.[
                                      activity.type
                                    ] ?? activity.type}{" "}
                                    ({activity.count})
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
        <div className="text-muted-foreground ms-8 flex items-center justify-between text-xs">
          <a href="#" className="hover:text-primary transition-colors">
            {p?.overview?.learnContributions ??
              "Learn how we count contributions"}
          </a>
          <div className="flex items-center gap-1">
            <span>{p?.overview?.less ?? "Less"}</span>
            <div className="flex gap-[2px]">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="size-[11px] rounded-[3px]"
                  style={LEVEL_STYLES[level]}
                />
              ))}
            </div>
            <span>{p?.overview?.more ?? "More"}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
