"use client"

import { useMemo, useState } from "react"
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleDot,
  FileText,
  FolderPlus,
  GitCommit,
  GitPullRequest,
  Star,
  Trophy,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { ProfileRole } from "./types"

interface ContributionActivityProps {
  role: ProfileRole
  data?: Record<string, unknown>
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
  year: number
): Map<string, ActivityItem[]> {
  const activities = new Map<string, ActivityItem[]>()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

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
          icon: <FileText className="text-muted-foreground size-4" />,
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
              date: date.toLocaleDateString(),
            },
            {
              name: "Physics Lab",
              status: "Active",
              date: date.toLocaleDateString(),
            },
          ],
          date,
          icon: <BookOpen className="text-muted-foreground size-4" />,
        })
      }

      // Achievement
      if (Math.random() > 0.7) {
        monthActivities.push({
          id: `achievement-${month}`,
          type: "achievement",
          title: "Earned an achievement",
          date,
          icon: <Trophy className="text-muted-foreground size-4" />,
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
            { name: "Grade 12 - Statistics", count: Math.floor(count * 0.25) },
          ],
          count,
          date,
          icon: <Users className="text-muted-foreground size-4" />,
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
          icon: <Star className="text-muted-foreground size-4" />,
        })
      }

      // Created resource
      if (Math.random() > 0.6) {
        monthActivities.push({
          id: `resource-${month}`,
          type: "created",
          title: "Created new learning materials",
          items: [
            { name: "Calculus Study Guide", date: date.toLocaleDateString() },
          ],
          date,
          icon: <FolderPlus className="text-muted-foreground size-4" />,
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
          icon: <BookOpen className="text-muted-foreground size-4" />,
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
              date: date.toLocaleDateString(),
            },
          ],
          date,
          icon: <Calendar className="text-muted-foreground size-4" />,
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
          icon: <FileText className="text-muted-foreground size-4" />,
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
              date: date.toLocaleDateString(),
            },
            { name: "Fee Collection Summary", date: date.toLocaleDateString() },
          ],
          date,
          icon: <FolderPlus className="text-muted-foreground size-4" />,
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
}: ContributionActivityProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  const activities = useMemo(() => {
    return generateActivityForRole(role, selectedYear)
  }, [role, selectedYear])

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

  const roleLabels = {
    student: "Contribution activity",
    teacher: "Teaching activity",
    parent: "Engagement activity",
    staff: "Work activity",
  }

  return (
    <div className="border-border space-y-4 rounded-lg border p-6">
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-base font-semibold">
          {roleLabels[role]}
        </h3>
        <div className="flex gap-1">
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="space-y-6">
        {Array.from(activities.entries()).map(([month, items]) => (
          <div key={month} className="space-y-3">
            {/* Month header */}
            <h4 className="text-muted-foreground text-sm font-medium">
              {month}
            </h4>

            {/* Activity items */}
            <div className="border-border ms-4 space-y-3 border-s-2 ps-4">
              {items.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline dot */}
                  <div className="bg-border absolute -start-[1.4rem] top-1 size-2.5 rounded-full" />

                  <div className="space-y-2">
                    {/* Activity header */}
                    <div className="flex items-start gap-2">
                      {item.icon}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm">{item.title}</p>

                        {/* Expandable items list */}
                        {item.items && item.items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.items
                              .slice(
                                0,
                                expandedItems.has(item.id) ? undefined : 2
                              )
                              .map((subItem, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-primary cursor-pointer hover:underline">
                                    {subItem.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {subItem.count && (
                                      <div className="flex items-center gap-1">
                                        <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                                          <div
                                            className="bg-chart-2 h-full rounded-full"
                                            style={{
                                              width: `${Math.min((subItem.count / (item.count || 1)) * 100 * 3, 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-muted-foreground">
                                          {subItem.count}
                                        </span>
                                      </div>
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
                                        <span className="text-muted-foreground">
                                          {subItem.date}
                                        </span>
                                      )}
                                  </div>
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
                  </div>
                </div>
              ))}
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
