"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  Eye,
  TriangleAlert,
  ChevronRight,
  Plus,
  Megaphone,
  FileText,
  Receipt,
  Clock,
  UserPlus,
  CreditCard,
  Bell,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

// ============================================================================
// TYPES
// ============================================================================

interface StatusCardData {
  name: string
  stat: string
  goalsAchieved: number
  totalGoals: number
  status: "within" | "observe" | "critical"
  href: string
}

interface QuickStatData {
  label: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
}

interface FinanceStatData {
  label: string
  value: string
}

interface ActivityData {
  action: string
  user: string
  time: string
  type: string
}

interface SummaryData {
  label: string
  value: string
}

interface AdminDashboardClientProps {
  locale: string
  subdomain: string
  userName: string
  schoolName: string
  statusData: StatusCardData[]
  quickStats: QuickStatData[]
  financeStats: FinanceStatData[]
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}

// ============================================================================
// SECTION 1: School Status (Stats-06 Pattern) - 3 Columns
// ============================================================================

function StatusCard({ name, stat, goalsAchieved, totalGoals, status, href }: StatusCardData) {
  return (
    <Card className="p-6 relative">
      <CardContent className="p-0">
        <p className="text-sm font-medium text-muted-foreground">{name}</p>
        <p className="text-3xl font-semibold text-foreground">{stat}</p>
        <div className="group relative mt-6 flex items-center space-x-4 rounded-md bg-muted/60 p-2 hover:bg-muted">
          <div className="flex w-full items-center justify-between truncate">
            <div className="flex items-center space-x-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded",
                  status === "within"
                    ? "bg-emerald-500 text-white"
                    : status === "observe"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"
                )}
              >
                {status === "within" ? (
                  <Check className="size-4 shrink-0" aria-hidden={true} />
                ) : status === "observe" ? (
                  <Eye className="size-4 shrink-0" aria-hidden={true} />
                ) : (
                  <TriangleAlert className="size-4 shrink-0" aria-hidden={true} />
                )}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">
                  <Link href={href} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden={true} />
                    {goalsAchieved}/{totalGoals} goals
                  </Link>
                </p>
                <p
                  className={cn(
                    "text-sm font-medium capitalize",
                    status === "within"
                      ? "text-emerald-700 dark:text-emerald-500"
                      : status === "observe"
                        ? "text-yellow-700 dark:text-yellow-500"
                        : "text-red-700 dark:text-red-500"
                  )}
                >
                  {status === "within" ? "On Track" : status === "observe" ? "Needs Attention" : "Critical"}
                </p>
              </div>
            </div>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
              aria-hidden={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SchoolStatusSection({ statusData }: { statusData: StatusCardData[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">School Status</h2>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statusData.map((item) => (
          <StatusCard key={item.name} {...item} />
        ))}
      </dl>
    </section>
  )
}

// ============================================================================
// SECTION 2: Quick Stats - 3 Cards with Icons
// ============================================================================

const iconMap = {
  Students: Users,
  Teachers: GraduationCap,
  Classes: BookOpen,
}

function StatBadge({ label, value, change, changeType }: QuickStatData) {
  const Icon = iconMap[label as keyof typeof iconMap] || Users

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  changeType === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  changeType === "negative" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  changeType === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3" />}
                {changeType === "negative" && <TrendingDown className="mr-1 h-3 w-3" />}
                {change}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickStatsSection({ quickStats }: { quickStats: QuickStatData[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Quick Stats</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <StatBadge key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 3: Financial Overview - Stats Row + Full Width Chart
// ============================================================================

const financeIconMap: Record<string, React.ElementType> = {
  Revenue: DollarSign,
  Collected: Check,
  Pending: Clock,
  Overdue: TriangleAlert,
}

function FinancialSection({ financeStats }: { financeStats: FinanceStatData[] }) {
  const chartData = [
    { month: "Jan", revenue: 18000 },
    { month: "Feb", revenue: 22000 },
    { month: "Mar", revenue: 19500 },
    { month: "Apr", revenue: 25000 },
    { month: "May", revenue: 21000 },
    { month: "Jun", revenue: 19500 },
  ]

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Financial Overview</h2>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {financeStats.map((stat) => {
            const Icon = financeIconMap[stat.label] || DollarSign
            return (
              <Card key={stat.label} className="p-4">
                <CardContent className="p-0 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Chart */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 4: Recent Activity - Feed (2/3) + Summary Stats (1/3)
// ============================================================================

const activityIconMap: Record<string, React.ElementType> = {
  enrollment: UserPlus,
  payment: CreditCard,
  announcement: Bell,
  academic: FileText,
}

function RecentActivitySection({
  recentActivities,
  todaySummary,
}: {
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity Feed</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              See All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const Icon = activityIconMap[activity.type] || FileText
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {todaySummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 5: Schedule - Mini Calendar (1/3) + Event List (2/3)
// ============================================================================

function ScheduleSection() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const upcomingEvents = [
    { date: "Dec 5", title: "Parent Meeting", time: "10:00 AM", location: "Main Hall" },
    { date: "Dec 10", title: "Mid-term Exams Start", time: "All Day", location: "All Classes" },
    { date: "Dec 25", title: "Winter Holiday", time: "All Day", location: "School Closed" },
    { date: "Jan 2", title: "New Semester Begins", time: "8:00 AM", location: "All Classes" },
  ]

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Schedule</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mini Calendar */}
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </Card>

        {/* Event List */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View Calendar <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10">
                  <span className="text-xs text-muted-foreground">{event.date.split(" ")[0]}</span>
                  <span className="text-lg font-bold text-primary">{event.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                    <span>-</span>
                    <span>{event.location}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 6: Quick Actions - Horizontal Button Row
// ============================================================================

function QuickActionsSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  const actions = [
    { icon: Plus, label: "Add Student", href: `/${locale}/s/${subdomain}/students/new`, variant: "default" as const },
    { icon: Megaphone, label: "Announcement", href: `/${locale}/s/${subdomain}/announcements/new`, variant: "secondary" as const },
    { icon: FileText, label: "Report", href: `/${locale}/s/${subdomain}/admin/reports`, variant: "secondary" as const },
    { icon: Receipt, label: "Invoice", href: `/${locale}/s/${subdomain}/finance/invoices/new`, variant: "secondary" as const },
  ]

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant} asChild>
              <Link href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </Card>
    </section>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function AdminDashboardClient({
  locale,
  subdomain,
  statusData,
  quickStats,
  financeStats,
  recentActivities,
  todaySummary,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: School Status (Stats-06) */}
      <SchoolStatusSection statusData={statusData} />

      {/* Section 2: Quick Stats */}
      <QuickStatsSection quickStats={quickStats} />

      {/* Section 3: Financial Overview */}
      <FinancialSection financeStats={financeStats} />

      {/* Section 4: Recent Activity */}
      <RecentActivitySection recentActivities={recentActivities} todaySummary={todaySummary} />

      {/* Section 5: Schedule */}
      <ScheduleSection />

      {/* Section 6: Quick Actions */}
      <QuickActionsSection locale={locale} subdomain={subdomain} />
    </div>
  )
}
