"use client"

import { useMemo } from "react"
import { Award, BookOpen, CheckCircle, MessageSquare } from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { ActivitySummary, ProfileRole } from "./types"

interface ActivityOverviewProps {
  role?: ProfileRole
  data?: Record<string, unknown>
}

// Activity categories by role
const ACTIVITY_CATEGORIES = {
  student: [
    {
      id: "assignments",
      label: "Assignments",
      icon: BookOpen,
      color: "bg-emerald-500",
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: CheckCircle,
      color: "bg-blue-500",
    },
    { id: "grades", label: "Assessments", icon: Award, color: "bg-purple-500" },
    {
      id: "participation",
      label: "Participation",
      icon: MessageSquare,
      color: "bg-orange-500",
    },
  ],
  teacher: [
    {
      id: "classes",
      label: "Classes Taught",
      icon: BookOpen,
      color: "bg-emerald-500",
    },
    {
      id: "grading",
      label: "Grading",
      icon: CheckCircle,
      color: "bg-blue-500",
    },
    {
      id: "meetings",
      label: "Meetings",
      icon: MessageSquare,
      color: "bg-purple-500",
    },
    {
      id: "curriculum",
      label: "Curriculum",
      icon: Award,
      color: "bg-orange-500",
    },
  ],
  parent: [
    {
      id: "portal",
      label: "Portal Activity",
      icon: BookOpen,
      color: "bg-emerald-500",
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    { id: "events", label: "Events", icon: Award, color: "bg-purple-500" },
    {
      id: "payments",
      label: "Payments",
      icon: CheckCircle,
      color: "bg-orange-500",
    },
  ],
  staff: [
    { id: "tasks", label: "Tasks", icon: CheckCircle, color: "bg-emerald-500" },
    { id: "reports", label: "Reports", icon: BookOpen, color: "bg-blue-500" },
    {
      id: "meetings",
      label: "Meetings",
      icon: MessageSquare,
      color: "bg-purple-500",
    },
    { id: "records", label: "Records", icon: Award, color: "bg-orange-500" },
  ],
}

// Generate random but realistic activity data
function generateActivityData(role: ProfileRole): ActivitySummary[] {
  const categories = ACTIVITY_CATEGORIES[role] || ACTIVITY_CATEGORIES.student

  // Generate base values with some randomness
  const values = categories.map(() => Math.floor(Math.random() * 50) + 10)
  const total = values.reduce((a, b) => a + b, 0)

  return categories.map((cat, idx) => ({
    label: cat.label,
    value: values[idx],
    percentage: Math.round((values[idx] / total) * 100),
    color: cat.color,
  }))
}

// Contributed repositories/items list by role
const CONTRIBUTED_ITEMS = {
  student: [
    { name: "Advanced Mathematics Course", link: "#" },
    { name: "Science Project Repository", link: "#" },
    { name: "English Literature Studies", link: "#" },
  ],
  teacher: [
    { name: "Grade 10 Mathematics", link: "#" },
    { name: "Advanced Calculus Materials", link: "#" },
    { name: "Department Resources", link: "#" },
  ],
  parent: [
    { name: "Emma's Academic Progress", link: "#" },
    { name: "Liam's Activities", link: "#" },
    { name: "School Events Calendar", link: "#" },
  ],
  staff: [
    { name: "Student Records System", link: "#" },
    { name: "Administrative Tasks", link: "#" },
    { name: "Event Management", link: "#" },
  ],
}

export default function ActivityOverview({
  role = "student",
  data,
}: ActivityOverviewProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  const activityData = useMemo(() => generateActivityData(role), [role])
  const contributedItems = CONTRIBUTED_ITEMS[role] || CONTRIBUTED_ITEMS.student
  const categories = ACTIVITY_CATEGORIES[role] || ACTIVITY_CATEGORIES.student
  const total = activityData.reduce((sum, item) => sum + item.value, 0)

  // Calculate pie chart segments
  const pieSegments = useMemo(() => {
    let cumulativePercentage = 0
    return activityData.map((item) => {
      const start = cumulativePercentage
      cumulativePercentage += item.percentage
      return {
        ...item,
        start,
        end: cumulativePercentage,
      }
    })
  }, [activityData])

  return (
    <TooltipProvider>
      <div className="border-border space-y-4 rounded-lg border p-6">
        <h3 className="text-foreground text-base font-semibold">
          Activity overview
        </h3>

        <div
          className={`grid gap-6 ${useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
        >
          {/* Left side - Contributed items */}
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <svg className="size-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z" />
              </svg>
              <span>Active in</span>
            </div>
            <div className="ms-6 space-y-1.5">
              {contributedItems.map((item, idx) => (
                <div key={idx} className="text-sm">
                  <a
                    href={item.link}
                    className="text-primary transition-colors hover:underline"
                  >
                    {item.name}
                  </a>
                  {idx < contributedItems.length - 1 && (
                    <span className="text-muted-foreground">,</span>
                  )}
                </div>
              ))}
              <div className="text-muted-foreground text-sm">
                and {Math.floor(Math.random() * 10) + 5} other areas
              </div>
            </div>
          </div>

          {/* Right side - Activity chart */}
          <div className="relative">
            <div className="flex items-center justify-center">
              {/* Pie Chart Container */}
              <div className="relative size-32">
                <svg viewBox="0 0 100 100" className="-rotate-90 transform">
                  {pieSegments.map((segment, idx) => {
                    const radius = 40
                    const circumference = 2 * Math.PI * radius
                    const startOffset = (segment.start / 100) * circumference
                    const segmentLength =
                      (segment.percentage / 100) * circumference

                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            strokeWidth="20"
                            className={`${segment.color} cursor-pointer transition-opacity hover:opacity-80`}
                            style={{
                              stroke: "currentColor",
                              strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
                              strokeDashoffset: -startOffset,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-semibold">{segment.label}</p>
                            <p className="text-muted-foreground">
                              {segment.percentage}% ({segment.value} activities)
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-foreground text-2xl font-bold">
                    {total}
                  </span>
                  <span className="text-muted-foreground text-xs">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="ms-6 space-y-2">
                {activityData.map((item, idx) => {
                  const Icon = categories[idx]?.icon || BookOpen
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`size-3 rounded-sm ${item.color}`} />
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-foreground font-semibold">
                        {item.percentage}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
