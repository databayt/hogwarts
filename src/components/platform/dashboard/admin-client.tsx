"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  TriangleAlert,
  ChevronRight,
  Megaphone,
  FileText,
  Clock,
  UserPlus,
  CreditCard,
  Bell,
  CalendarDays,
  Settings,
  Activity,
  Zap,
  Shield,
  Database,
  Server,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  TrendingDown as TrendingDownIcon,
} from "lucide-react"
import { DetailedUsageTableDemo } from "@/components/platform/billing/detailed-usage-table-demo"
import { InvoiceHistoryDemo } from "@/components/platform/billing/invoice-history-demo"
import { TopSection } from "./top-section"
import { QuickLookSection } from "./quick-look-section"
import Link from "next/link"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, Bar, BarChart, Area, AreaChart, Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts"

// ============================================================================
// TYPES
// ============================================================================

interface QuickStatData {
  label: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  href?: string
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
  quickStats: QuickStatData[]
  financeStats: FinanceStatData[]
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}

// ============================================================================
// SECTION 2: System Health Status
// ============================================================================

function SystemHealthSection() {
  const systemStatus = [
    { name: "Database", status: "operational", icon: Database, latency: "12ms" },
    { name: "API Server", status: "operational", icon: Server, latency: "45ms" },
    { name: "Storage", status: "operational", icon: HardDrive, latency: "23ms" },
    { name: "Network", status: "degraded", icon: Wifi, latency: "156ms" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-emerald-500"
      case "degraded": return "text-amber-500"
      case "down": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return CheckCircle
      case "degraded": return AlertCircle
      case "down": return XCircle
      default: return AlertCircle
    }
  }

  const operationalCount = systemStatus.filter(s => s.status === "operational").length

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </h2>
        <Badge variant={operationalCount === systemStatus.length ? "default" : "secondary"} className={operationalCount === systemStatus.length ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}>
          {operationalCount}/{systemStatus.length} Operational
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {systemStatus.map((system) => {
          const StatusIcon = getStatusIcon(system.status)
          return (
            <Card key={system.name} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <system.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{system.name}</span>
                  </div>
                  <StatusIcon className={cn("h-4 w-4", getStatusColor(system.status))} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">{system.status}</span>
                  <span className="text-xs text-muted-foreground">{system.latency}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 3: Quick Stats (3 Cards with Icons)
// ============================================================================

const iconMap = {
  Students: Users,
  Teachers: GraduationCap,
  Classes: BookOpen,
}

function StatBadge({ label, value, change, changeType, href }: QuickStatData) {
  const IconComponent = iconMap[label as keyof typeof iconMap] || Users

  const content = (
    <CardContent className="p-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
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
        {href && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Link href={href}>
        <Card className="p-6 cursor-pointer hover:bg-accent/50 transition-colors">
          {content}
        </Card>
      </Link>
    )
  }

  return <Card className="p-6">{content}</Card>
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
// SECTION 5: Financial Overview
// ============================================================================

const financeIconMap: Record<string, React.ElementType> = {
  Revenue: DollarSign,
  Collected: Check,
  Pending: Clock,
  Overdue: TriangleAlert,
}

const revenueChartData = [
  { average: 18000, today: 22000, day: "Monday" },
  { average: 19000, today: 25000, day: "Tuesday" },
  { average: 17500, today: 21000, day: "Wednesday" },
  { average: 20000, today: 28000, day: "Thursday" },
  { average: 18500, today: 24000, day: "Friday" },
  { average: 16000, today: 19500, day: "Saturday" },
  { average: 15000, today: 17000, day: "Sunday" },
]

const revenueChartConfig = {
  today: {
    label: "This Week",
    color: "var(--primary)",
  },
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function FinancialSection({ financeStats }: { financeStats: FinanceStatData[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Financial Overview</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {financeStats.map((stat) => {
            const IconComponent = financeIconMap[stat.label] || DollarSign
            return (
              <Card key={stat.label} className="p-4">
                <CardContent className="p-0 flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Collected</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your revenue collection is ahead of where you normally are.
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="w-full md:h-[200px]">
              <LineChart
                accessibilityLayer
                data={revenueChartData}
                margin={{ top: 5, right: 10, left: 16, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <Line
                  type="monotone"
                  dataKey="today"
                  strokeWidth={2}
                  stroke="var(--color-today)"
                  dot={{ fill: "var(--color-today)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="average"
                  stroke="var(--color-average)"
                  strokeOpacity={0.5}
                  dot={{ fill: "var(--color-average)", opacity: 0.5 }}
                  activeDot={{ r: 5 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 7: Attendance Overview
// ============================================================================

const attendanceData = [
  { grade: "Grade 5", attendance: 96, students: 32 },
  { grade: "Grade 6", attendance: 94, students: 28 },
  { grade: "Grade 7", attendance: 92, students: 35 },
  { grade: "Grade 8", attendance: 88, students: 30 },
  { grade: "Grade 9", attendance: 91, students: 33 },
  { grade: "Grade 10", attendance: 85, students: 38 },
]

const attendanceChartConfig = {
  attendance: {
    label: "Attendance %",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

function AttendanceSection() {
  const avgAttendance = Math.round(attendanceData.reduce((sum, d) => sum + d.attendance, 0) / attendanceData.length)
  const lowestGrade = attendanceData.reduce((min, d) => d.attendance < min.attendance ? d : min, attendanceData[0])

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Attendance Overview</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance by Grade</CardTitle>
            <CardDescription>Today&apos;s attendance rate across all grades</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={attendanceChartConfig} className="w-full h-[200px]">
              <BarChart accessibilityLayer data={attendanceData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="grade" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.replace("Grade ", "G")} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="attendance" fill="var(--color-attendance)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-4xl font-bold text-primary">{avgAttendance}%</p>
              <p className="text-sm text-muted-foreground mt-1">Average Attendance</p>
            </div>
            {lowestGrade.attendance < 90 && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Attention Needed</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowestGrade.grade} has {lowestGrade.attendance}% attendance
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Students</span>
                <span className="font-medium">{attendanceData.reduce((sum, d) => sum + d.students, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Present Today</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {Math.round(attendanceData.reduce((sum, d) => sum + (d.students * d.attendance / 100), 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 8: Academic Performance
// ============================================================================

const performanceData = [
  { subject: "Mathematics", average: 78, change: "+3%" },
  { subject: "Science", average: 82, change: "+5%" },
  { subject: "English", average: 75, change: "-2%" },
  { subject: "History", average: 80, change: "+1%" },
  { subject: "Geography", average: 77, change: "+2%" },
]

function AcademicPerformanceSection() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Academic Performance</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Performance</CardTitle>
          <CardDescription>Average scores across all grades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceData.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{subject.subject}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{subject.average}%</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      subject.change.startsWith("+")
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    )}
                  >
                    {subject.change.startsWith("+") ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                    {subject.change}
                  </Badge>
                </div>
              </div>
              <Progress value={subject.average} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

// ============================================================================
// SECTION 9: Recent Activity
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
                const IconComponent = activityIconMap[activity.type] || FileText
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
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
// SECTION 10: Resource Usage (from billingsdk)
// ============================================================================

function ResourceUsageSection() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Resource Usage</h2>
      <DetailedUsageTableDemo />
    </section>
  )
}

// ============================================================================
// SECTION 11: Invoice History (from billingsdk)
// ============================================================================

function InvoiceSection() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Billing History</h2>
      <InvoiceHistoryDemo />
    </section>
  )
}

// ============================================================================
// SECTION 12: Quick Actions
// ============================================================================

function QuickActionsSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  const actions = [
    { icon: UserPlus, label: "Add Student", description: "Enroll new student", href: `/${locale}/s/${subdomain}/students/new` },
    { icon: Bell, label: "Announce", description: "Send notification", href: `/${locale}/s/${subdomain}/announcements/new` },
    { icon: FileText, label: "View Reports", description: "Analytics & data", href: `/${locale}/s/${subdomain}/admin/reports` },
    { icon: CreditCard, label: "Billing", description: "Manage payments", href: `/${locale}/s/${subdomain}/billing` },
    { icon: Settings, label: "Settings", description: "School config", href: `/${locale}/s/${subdomain}/admin/settings` },
    { icon: Shield, label: "Security", description: "Access control", href: `/${locale}/s/${subdomain}/admin` },
  ]

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {actions.map((action) => (
          <Button key={action.label} asChild variant="outline" className="justify-start h-auto py-3">
            <Link href={action.href}>
              <action.icon className="mr-2 h-4 w-4" />
              <span className="flex flex-col items-start">
                <span className="font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION 13: School Statistics Summary
// ============================================================================

function SchoolStatsSummary() {
  const stats = [
    { label: "Active Students", value: "1,245", change: "+5.2%", changeType: "positive" as const },
    { label: "Teaching Staff", value: "86", change: "+2", changeType: "positive" as const },
    { label: "Fee Collection Rate", value: "87%", change: "-3%", changeType: "negative" as const },
    { label: "Avg Attendance", value: "91%", change: "+1.5%", changeType: "positive" as const },
  ]

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">School Statistics</h2>
      <div className="grid grid-cols-1 gap-px rounded-xl bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            className={cn(
              "rounded-none border-0 shadow-none py-0",
              index === 0 && "rounded-l-xl",
              index === stats.length - 1 && "rounded-r-xl"
            )}
          >
            <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p
                className={cn(
                  "text-xs font-medium",
                  stat.changeType === "positive"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                )}
              >
                {stat.change}
              </p>
              <p className="w-full flex-none text-3xl font-medium tracking-tight text-foreground">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function AdminDashboardClient({
  locale,
  subdomain,
  userName,
  schoolName,
  quickStats,
  financeStats,
  recentActivities,
  todaySummary,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION ============ */}
      <div className="space-y-6">
        {/* Section 1: Upcoming Class + Weather (FIRST) */}
        <TopSection locale={locale} subdomain={subdomain} />

        {/* Section 2: Quick Look */}
        <QuickLookSection locale={locale} subdomain={subdomain} />

        {/* Section 3: Quick Actions */}
        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Section 4: System Health */}
        <SystemHealthSection />

        {/* Section 5: Quick Stats */}
        <QuickStatsSection quickStats={quickStats} />
      </div>

      {/* ============ MAIN CONTENT ============ */}

      {/* Section 6: Financial Overview */}
      <FinancialSection financeStats={financeStats} />

      {/* Section 7: Attendance Overview */}
      <AttendanceSection />

      {/* Section 8: Academic Performance */}
      <AcademicPerformanceSection />

      {/* Section 9: Recent Activity */}
      <RecentActivitySection recentActivities={recentActivities} todaySummary={todaySummary} />

      {/* Section 10: Resource Usage */}
      <ResourceUsageSection />

      {/* Section 11: Invoice History */}
      <InvoiceSection />

      {/* Section 12: School Statistics Summary */}
      <SchoolStatsSummary />
    </div>
  )
}
