"use client"

import { useMemo } from "react"
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

interface ActivityGraphProps {
  role: ProfileRole
  userId?: string
  year: number
  dictionary?: Record<string, any>
  lang?: string
}

/**
 * GitHub-inspired contribution colors. EXCEPTION: exact GitHub palette for data
 * visualization authenticity, defined as CSS custom properties in globals.css.
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

/** An empty (all-zero) year grid — shown honestly when there is no activity. */
function emptyYearData(role: ProfileRole, year: number): ContributionGraphData {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  const contributions: ContributionDataPoint[] = []
  const current = new Date(startDate)
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

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    { weekday: "long", month: "short", day: "numeric", year: "numeric" }
  )
}

export default function ActivityGraph({
  role = "student",
  userId,
  year,
  dictionary,
  lang,
}: ActivityGraphProps) {
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

  const roleLabel = p?.graph?.[ROLE_LABEL_KEYS[role]] ?? ""

  const {
    data: fetchedData,
    error,
    isLoading,
  } = useSWR(
    userId ? ["contribution-data", userId, year] : null,
    async () => {
      const result = await getContributionData({ userId, year })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  // Real data when available; otherwise an honest empty grid (never random mock).
  const graphData = fetchedData ?? emptyYearData(role, year)

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
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: "",
          level: 0,
          count: 0,
          activities: [],
        })
      }
      result.push(currentWeek)
    }
    return result
  }, [graphData.contributions])

  const monthPositions = useMemo(() => {
    const positions: { month: string; position: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, weekIdx) => {
      const firstWithDate = week.find((d) => d.date)
      if (firstWithDate) {
        const month = new Date(firstWithDate.date).getMonth()
        if (month !== lastMonth) {
          positions.push({ month: months[month], position: weekIdx })
          lastMonth = month
        }
      }
    })
    return positions
  }, [weeks, months])

  if (isLoading && !fetchedData) {
    return (
      <div className="space-y-4">
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
        {error && (
          <p className="text-muted-foreground mb-2 text-xs">
            {p?.graph?.loadError ?? ""}
          </p>
        )}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-max">
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

            <div className="flex">
              <div className="text-muted-foreground me-2 flex flex-col gap-[3px] text-[10px]">
                {weekdays.map((day: string, idx: number) => (
                  <span key={idx} className="h-[10px] leading-[10px]">
                    {day}
                  </span>
                ))}
              </div>

              <div
                className="flex gap-[3px]"
                role="img"
                aria-label={(p?.graph?.heatmapLabel ?? "{year}").replace(
                  "{year}",
                  String(year)
                )}
              >
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) =>
                      day.date ? (
                        <Tooltip key={`${weekIdx}-${dayIdx}`}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${
                                day.count > 0
                                  ? `${day.count} ${roleLabel}`
                                  : roleLabel
                                    ? `${p?.graph?.no ?? ""} ${roleLabel}`.trim()
                                    : ""
                              } — ${formatDate(day.date, locale)}`}
                              className="hover:ring-foreground/20 focus-visible:ring-ring size-[11px] cursor-pointer rounded-[3px] transition-all hover:ring-1 focus-visible:ring-2 focus-visible:outline-none"
                              style={LEVEL_STYLES[day.level]}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="text-sm">
                              <p className="font-semibold">
                                {day.count > 0
                                  ? `${day.count} ${roleLabel}`
                                  : `${p?.graph?.no ?? ""} ${roleLabel}`.trim()}
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
                                      • {activity.label} ({activity.count})
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          key={`${weekIdx}-${dayIdx}`}
                          aria-hidden="true"
                          className="size-[11px] rounded-[3px] opacity-0"
                        />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-muted-foreground ms-8 mt-2 flex items-center justify-end text-xs">
          <div className="flex items-center gap-1">
            <span>{p?.overview?.less ?? ""}</span>
            <div className="flex gap-[2px]" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="size-[11px] rounded-[3px]"
                  style={LEVEL_STYLES[level]}
                />
              ))}
            </div>
            <span>{p?.overview?.more ?? ""}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
