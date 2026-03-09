"use client"

import {
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSidebar } from "@/components/ui/sidebar"

interface ParentDashboardProps {
  data: Record<string, unknown>
}

// Children's data
const CHILDREN = [
  {
    name: "Emma Hassan",
    grade: "Grade 10",
    gpa: "3.9",
    attendance: 98,
    avatar: "/contributors/h.jpeg",
    status: "active",
  },
  {
    name: "Liam Hassan",
    grade: "Grade 8",
    gpa: "3.7",
    attendance: 95,
    avatar: "/contributors/d.jpeg",
    status: "active",
  },
  {
    name: "Sophia Hassan",
    grade: "Grade 6",
    gpa: "4.0",
    attendance: 100,
    avatar: "/contributors/h.jpeg",
    status: "active",
  },
]

// Upcoming events
const EVENTS = [
  {
    title: "Parent-Teacher Conference",
    child: "Emma",
    date: "Dec 18",
    time: "2:00 PM",
    type: "meeting",
  },
  {
    title: "Science Fair",
    child: "Liam",
    date: "Dec 22",
    time: "6:00 PM",
    type: "event",
  },
  {
    title: "Winter Concert",
    child: "Sophia",
    date: "Dec 20",
    time: "5:00 PM",
    type: "event",
  },
  {
    title: "Report Card Release",
    child: "All",
    date: "Dec 23",
    time: "9:00 AM",
    type: "academic",
  },
]

// Recent notifications
const NOTIFICATIONS = [
  { title: "Emma received A+ in Math Quiz", time: "2 hours ago", read: false },
  { title: "Liam's Science project submitted", time: "Yesterday", read: true },
  {
    title: "Payment receipt for December fees",
    time: "2 days ago",
    read: true,
  },
]

export default function ParentDashboard({ data }: ParentDashboardProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  const eventTypeColors = {
    meeting: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    event: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    academic: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div
        className={cn(
          "grid gap-4",
          useMobileLayout
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 md:grid-cols-4"
        )}
      >
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Children
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-blue-500">3</span>
            <p className="text-muted-foreground mt-1 text-xs">
              All active students
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Average GPA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-emerald-500">3.87</span>
            <p className="text-muted-foreground mt-1 text-xs">Family average</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="size-4 text-purple-500" />
              Attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-purple-500">97.7%</span>
            <p className="text-muted-foreground mt-1 text-xs">
              Combined average
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Bell className="size-4 text-orange-500" />
              Upcoming Events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-orange-500">5</span>
            <p className="text-muted-foreground mt-1 text-xs">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Children's Progress */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="text-primary size-5" />
            Children's Progress
          </CardTitle>
          <CardDescription>Academic performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "grid gap-4",
              useMobileLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
            )}
          >
            {CHILDREN.map((child, idx) => (
              <div
                key={idx}
                className="border-border bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="border-primary/30 size-12 border-2">
                    <AvatarImage src={child.avatar} alt={child.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {child.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{child.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {child.grade}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">GPA</span>
                      <span className="text-sm font-semibold text-emerald-500">
                        {child.gpa}
                      </span>
                    </div>
                    <Progress
                      value={(parseFloat(child.gpa) / 4) * 100}
                      className="h-1.5"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        Attendance
                      </span>
                      <span className="text-sm font-semibold text-blue-500">
                        {child.attendance}%
                      </span>
                    </div>
                    <Progress value={child.attendance} className="h-1.5" />
                  </div>
                </div>
                <button className="text-primary mt-4 w-full text-xs hover:underline">
                  View detailed report
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div
        className={cn(
          "grid gap-6",
          useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        {/* Upcoming Events */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-5 text-purple-500" />
              Upcoming Events
            </CardTitle>
            <CardDescription>School events and meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVENTS.map((event, idx) => (
              <div
                key={idx}
                className="border-border bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Calendar className="size-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.child}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <Badge
                    variant="outline"
                    className={cn(
                      "mb-1 text-[10px]",
                      eventTypeColors[
                        event.type as keyof typeof eventTypeColors
                      ]
                    )}
                  >
                    {event.type}
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    {event.date} • {event.time}
                  </p>
                </div>
              </div>
            ))}
            <button className="text-primary w-full py-2 text-sm hover:underline">
              View all events
            </button>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-5 text-orange-500" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Updates about your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFICATIONS.map((notification, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  notification.read
                    ? "border-border bg-card hover:bg-muted/50"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <div
                  className={cn(
                    "mt-2 size-2 shrink-0 rounded-full",
                    notification.read ? "bg-muted-foreground/30" : "bg-primary"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      !notification.read && "font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
            <button className="text-primary w-full py-2 text-sm hover:underline">
              View all notifications
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks and requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "grid gap-3",
              useMobileLayout ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
            )}
          >
            {[
              {
                icon: MessageSquare,
                label: "Contact Teacher",
                color: "text-blue-500",
              },
              {
                icon: CreditCard,
                label: "Pay Fees",
                color: "text-emerald-500",
              },
              {
                icon: Calendar,
                label: "Request Leave",
                color: "text-purple-500",
              },
              { icon: Award, label: "View Reports", color: "text-amber-500" },
            ].map((action, idx) => (
              <button
                key={idx}
                className="border-border bg-card hover:bg-muted/50 flex flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors"
              >
                <action.icon className={cn("size-6", action.color)} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
