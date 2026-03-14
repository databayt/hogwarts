"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Trophy } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OcticonExpand, OcticonRepo } from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"
import { useLocale } from "@/components/internationalization/use-locale"

import type { ProfileRole } from "./types"

interface ContributionActivityProps {
  role: ProfileRole
  data?: Record<string, unknown>
  selectedYear?: number
  onYearChange?: (year: number) => void
}

interface ActivityItem {
  id: string
  type:
    | "commits"
    | "created"
    | "pull_request"
    | "issue"
    | "achievement"
    | "assignment"
    | "attendance"
    | "grade"
  title: string
  description?: string
  count?: number
  items?: { name: string; count?: number; status?: string; date?: string }[]
  date: Date
  icon: React.ReactNode
  achievement?: {
    title: string
    description: string
    imageUrl?: string
  }
}

// Generate activity items based on role
function generateActivityForRole(
  role: ProfileRole,
  year: number,
  locale: Locale
): Map<string, ActivityItem[]> {
  const activities = new Map<string, ActivityItem[]>()
  const currentDate = new Date()

  // Generate 12 months of activity
  for (let month = 11; month >= 0; month--) {
    const date = new Date(year, month, 1)
    if (date > currentDate) continue

    const monthKey = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    const monthActivities: ActivityItem[] = []

    // Generate role-specific activities
    if (role === "student") {
      // Assignments submitted
      if (Math.random() > 0.3) {
        const count = Math.floor(Math.random() * 15) + 5
        monthActivities.push({
          id: `assignments-${month}`,
          type: "commits",
          title: `Submitted ${count} assignments in ${Math.floor(Math.random() * 4) + 2} subjects`,
          items: [
            { name: "Mathematics", count: Math.floor(count * 0.3) },
            { name: "Science", count: Math.floor(count * 0.25) },
            { name: "English", count: Math.floor(count * 0.2) },
          ],
          count,
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Course enrollment
      if (month === 8 || month === 0) {
        monthActivities.push({
          id: `enrolled-${month}`,
          type: "created",
          title: "Enrolled in new courses",
          items: [
            {
              name: "Advanced Mathematics",
              status: "Active",
              date: formatDate(date, locale),
            },
            {
              name: "Physics Lab",
              status: "Active",
              date: formatDate(date, locale),
            },
          ],
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Achievement
      if (Math.random() > 0.7) {
        monthActivities.push({
          id: `achievement-${month}`,
          type: "achievement",
          title: "Earned an achievement",
          date,
          icon: <OcticonRepo className="size-3.5" />,
          achievement: {
            title: [
              "Honor Roll",
              "Perfect Attendance",
              "Science Fair Winner",
              "Top Performer",
            ][Math.floor(Math.random() * 4)],
            description: "Recognized for outstanding academic performance",
          },
        })
      }
    } else if (role === "teacher") {
      // Classes taught
      if (Math.random() > 0.2) {
        const count = Math.floor(Math.random() * 50) + 20
        monthActivities.push({
          id: `classes-${month}`,
          type: "commits",
          title: `Conducted ${count} classes across ${Math.floor(Math.random() * 3) + 2} subjects`,
          items: [
            { name: "Grade 10 - Calculus", count: Math.floor(count * 0.4) },
            { name: "Grade 11 - Algebra", count: Math.floor(count * 0.35) },
            {
              name: "Grade 12 - Statistics",
              count: Math.floor(count * 0.25),
            },
          ],
          count,
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Grades published
      if (Math.random() > 0.4) {
        monthActivities.push({
          id: `grades-${month}`,
          type: "pull_request",
          title: `Published grades for ${Math.floor(Math.random() * 80) + 40} students`,
          items: [
            { name: "Mid-term Exams", status: "Published" },
            { name: "Assignment Grades", status: "Published" },
          ],
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Created resource
      if (Math.random() > 0.6) {
        monthActivities.push({
          id: `resource-${month}`,
          type: "created",
          title: "Created new learning materials",
          items: [
            { name: "Calculus Study Guide", date: formatDate(date, locale) },
          ],
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }
    } else if (role === "parent") {
      // Portal activity
      if (Math.random() > 0.3) {
        const count = Math.floor(Math.random() * 20) + 5
        monthActivities.push({
          id: `portal-${month}`,
          type: "commits",
          title: `Checked progress ${count} times for ${Math.floor(Math.random() * 2) + 1} children`,
          items: [
            { name: "Emma's Grades", count: Math.floor(count * 0.5) },
            { name: "Liam's Attendance", count: Math.floor(count * 0.3) },
          ],
          count,
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Event attendance
      if (Math.random() > 0.5) {
        monthActivities.push({
          id: `event-${month}`,
          type: "issue",
          title: "Attended school events",
          items: [
            {
              name: "Parent-Teacher Conference",
              date: formatDate(date, locale),
            },
          ],
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }
    } else if (role === "staff") {
      // Tasks completed
      if (Math.random() > 0.2) {
        const count = Math.floor(Math.random() * 30) + 10
        monthActivities.push({
          id: `tasks-${month}`,
          type: "commits",
          title: `Completed ${count} tasks across ${Math.floor(Math.random() * 3) + 2} departments`,
          items: [
            { name: "Student Records", count: Math.floor(count * 0.4) },
            { name: "Administrative", count: Math.floor(count * 0.35) },
          ],
          count,
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }

      // Report generated
      if (Math.random() > 0.5) {
        monthActivities.push({
          id: `report-${month}`,
          type: "created",
          title: "Generated reports",
          items: [
            {
              name: "Monthly Attendance Report",
              date: formatDate(date, locale),
            },
            { name: "Fee Collection Summary", date: formatDate(date, locale) },
          ],
          date,
          icon: <OcticonRepo className="size-3.5" />,
        })
      }
    }

    if (monthActivities.length > 0) {
      activities.set(monthKey, monthActivities)
    }
  }

  return activities
}

export default function ContributionActivity({
  role,
  data,
  selectedYear: selectedYearProp,
  onYearChange,
}: ContributionActivityProps) {
  const { locale } = useLocale()
  const currentYear = new Date().getFullYear()
  const [internalYear, setInternalYear] = useState(currentYear)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const selectedYear = selectedYearProp ?? internalYear
  const setSelectedYear = onYearChange ?? setInternalYear

  const activities = useMemo(() => {
    return generateActivityForRole(role, selectedYear, locale)
  }, [role, selectedYear, locale])

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-foreground text-sm font-medium">
        Contribution activity
      </h3>

      {/* Activity timeline */}
      <div className="space-y-6">
        {Array.from(activities.entries()).map(([month, items]) => (
          <div key={month}>
            {/* Month header with HR line */}
            <div className="mb-3 flex items-center gap-3">
              <h4 className="text-foreground shrink-0 text-xs font-semibold">
                {month}
              </h4>
              <div className="border-border h-px flex-1 border-t" />
            </div>

            {/* Vertical timeline + activity items */}
            <div className="relative ms-4 ps-6">
              {/* Vertical line */}
              <div className="border-border absolute start-0 top-0 bottom-0 border-s-2" />

              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Timeline circle with icon */}
                    <div className="bg-muted border-background absolute -start-[2.375rem] top-0 flex size-7 items-center justify-center rounded-full border-2">
                      <span className="text-muted-foreground flex items-center justify-center">
                        {item.icon}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Activity header - title + expand icon */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground text-sm font-medium">
                          {item.title}
                        </p>
                        {item.items && item.items.length > 0 && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
                          >
                            <OcticonExpand className="size-4" />
                          </button>
                        )}
                      </div>

                      {/* Expandable items list */}
                      {item.items && item.items.length > 0 && (
                        <div className="space-y-1.5">
                          {item.items
                            .slice(
                              0,
                              expandedItems.has(item.id) ? undefined : 2
                            )
                            .map((subItem, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 text-xs"
                              >
                                <span className="cursor-pointer text-[#0969da] underline">
                                  {subItem.name}
                                </span>
                                {subItem.count != null && (
                                  <>
                                    <span className="text-muted-foreground underline">
                                      {subItem.count}{" "}
                                      {subItem.count === 1
                                        ? "commit"
                                        : "commits"}
                                    </span>
                                    <div className="ms-auto flex items-center">
                                      <div
                                        className="h-2.5 rounded-full bg-green-500"
                                        style={{
                                          width: `${Math.max(Math.min((subItem.count / (item.count || 1)) * 120, 120), 6)}px`,
                                          opacity: Math.max(
                                            0.3,
                                            Math.min(
                                              (subItem.count /
                                                (item.count || 1)) *
                                                2,
                                              1
                                            )
                                          ),
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                                {subItem.status && (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 text-[10px]"
                                  >
                                    {subItem.status}
                                  </Badge>
                                )}
                                {subItem.date &&
                                  !subItem.count &&
                                  !subItem.status && (
                                    <span className="text-muted-foreground ms-auto">
                                      {subItem.date}
                                    </span>
                                  )}
                              </div>
                            ))}
                          {item.items.length > 2 && (
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                            >
                              {expandedItems.has(item.id) ? (
                                <>
                                  <ChevronUp className="size-3" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="size-3" />
                                  Show {item.items.length - 2} more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Achievement card */}
                      {item.achievement && (
                        <div className="border-border bg-card mt-3 rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
                              <Trophy className="size-6 text-white" />
                            </div>
                            <div>
                              <p className="text-primary text-sm font-semibold">
                                {item.achievement.title}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {item.achievement.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {activities.size === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            <p className="text-sm">No activity recorded for {selectedYear}</p>
          </div>
        )}
      </div>

      {/* Show more button */}
      <div className="pt-4">
        <Button variant="outline" className="w-full" size="sm">
          Show more activity
        </Button>
      </div>
    </div>
  )
}
