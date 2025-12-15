"use client"

import { useMemo, useState } from "react"

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

import type { ActivityDataPoint, ProfileRole } from "./types"

interface ActivityGraphProps {
  role: ProfileRole
  data?: Record<string, unknown>
}

/**
 * GitHub-inspired Contribution Graph Colors
 *
 * EXCEPTION: This component uses exact GitHub colors for data visualization
 * authenticity. The colors are defined as CSS custom properties in globals.css
 * and are documented in .claude/skills/ui-validator.md under "Exceptions".
 *
 * Light mode: #ebedf0 → #9be9a8 → #40c463 → #30a14e → #216e39
 * Dark mode:  #161b22 → #0e4429 → #006d32 → #26a641 → #39d353
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

// Generate activity data for a year
function generateActivityData(
  startDate: Date,
  endDate: Date,
  role: ProfileRole
): ActivityDataPoint[] {
  const data: ActivityDataPoint[] = []
  const current = new Date(startDate)

  // Adjust start to Sunday of that week
  const startDayOfWeek = current.getDay()
  current.setDate(current.getDate() - startDayOfWeek)

  while (current <= endDate) {
    // Generate realistic school activity patterns
    const dayOfWeek = current.getDay()
    const month = current.getMonth()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isSchoolMonth = month >= 8 || month <= 5 // Sep-May is school year
    const isVacation = month === 6 || month === 7 // Summer vacation

    let baseIntensity = Math.random()

    // Adjust intensity based on realistic patterns
    if (isWeekend) baseIntensity *= 0.3
    if (!isSchoolMonth || isVacation) baseIntensity *= 0.2

    // Role-specific patterns
    if (role === "teacher" && dayOfWeek >= 1 && dayOfWeek <= 5)
      baseIntensity *= 1.2
    if (role === "parent" && dayOfWeek === 3) baseIntensity *= 0.8 // Less on Wednesdays
    if (role === "student" && dayOfWeek === 2) baseIntensity *= 1.3 // Busy on Tuesdays

    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (baseIntensity > 0.8) level = 4
    else if (baseIntensity > 0.6) level = 3
    else if (baseIntensity > 0.4) level = 2
    else if (baseIntensity > 0.15) level = 1

    const count = Math.floor(baseIntensity * 10)

    data.push({
      date: new Date(current),
      level,
      count,
      activities: count > 0 ? generateActivityTypes(role, count) : [],
    })

    current.setDate(current.getDate() + 1)
  }

  return data
}

function generateActivityTypes(role: ProfileRole, count: number): string[] {
  const activityTypes = {
    student: [
      "Attended class",
      "Submitted assignment",
      "Took quiz",
      "Library visit",
      "Club activity",
    ],
    teacher: [
      "Taught class",
      "Graded work",
      "Parent meeting",
      "Department meeting",
      "Curriculum planning",
    ],
    parent: [
      "Checked grades",
      "Teacher communication",
      "Event attendance",
      "Payment",
      "Portal login",
    ],
    staff: [
      "Processed request",
      "Updated records",
      "Meeting attended",
      "Report generated",
      "System update",
    ],
  }

  const types = activityTypes[role] || activityTypes.student
  const activities: string[] = []

  for (let i = 0; i < Math.min(count, 3); i++) {
    activities.push(types[Math.floor(Math.random() * types.length)])
  }

  return activities
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function ActivityGraph({
  role = "student",
  data,
}: ActivityGraphProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  const activityData = useMemo(() => {
    const year = parseInt(selectedYear)
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    return generateActivityData(startDate, endDate, role)
  }, [selectedYear, role])

  // Calculate total contributions
  const totalContributions = useMemo(() => {
    return activityData.reduce((sum, day) => sum + day.count, 0)
  }, [activityData])

  // Group data into weeks (columns)
  const weeks = useMemo(() => {
    const result: ActivityDataPoint[][] = []
    let currentWeek: ActivityDataPoint[] = []

    activityData.forEach((day) => {
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
          date: new Date(),
          level: 0,
          count: 0,
          activities: [],
        })
      }
      result.push(currentWeek)
    }

    return result
  }, [activityData])

  // Calculate month positions for labels
  const monthPositions = useMemo(() => {
    const positions: { month: string; position: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIdx) => {
      const firstDayWithData = week.find((d) => d.count >= 0)
      if (firstDayWithData) {
        const month = firstDayWithData.date.getMonth()
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

  const roleLabel = {
    student: "activities",
    teacher: "activities",
    parent: "interactions",
    staff: "tasks",
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-base font-semibold">
            {totalContributions.toLocaleString()} {roleLabel[role]} in{" "}
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
                                ? `${day.count} ${roleLabel[role]}`
                                : `No ${roleLabel[role]}`}
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
                                    • {activity}
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
            Learn how we count {roleLabel[role]}
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
