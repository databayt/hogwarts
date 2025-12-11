"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  FileText,
  UserPlus,
  CreditCard,
  Bell,
  Activity,
  Database,
  Server,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertCircle,
  XCircle,
  TriangleAlert,
} from "lucide-react"

// New unified components
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { QuickLookSection } from "./quick-look-section"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { ResourceUsageSection } from "./resource-usage-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { FinancialOverviewSection } from "./financial-overview-section"
import { SectionHeading } from "./section-heading"

import Link from "next/link"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CartesianGrid, Bar, BarChart, XAxis } from "recharts"

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
  recentActivities: ActivityData[]
  todaySummary: SummaryData[]
}

// ============================================================================
// SECTION: System Health Status
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
      <SectionHeading
        title="System Health"
        icon={Activity}
        badge={{
          label: `${operationalCount}/${systemStatus.length} Operational`,
          variant: operationalCount === systemStatus.length ? "default" : "secondary",
          className: operationalCount === systemStatus.length ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "",
        }}
      />
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
// SECTION: Quick Stats (3 Cards with Icons)
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
      <SectionHeading title="Quick Stats" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <StatBadge key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// SECTION: Attendance Overview
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
      <SectionHeading title="Attendance Overview" />
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
// SECTION: Academic Performance
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
      <SectionHeading title="Academic Performance" />
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
                    {subject.change.startsWith("+") ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
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
// SECTION: Recent Activity
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
      <SectionHeading title="Recent Activity" />
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
// SECTION: School Statistics Summary
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
      <SectionHeading title="School Statistics" />
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
// SECTION: Quick Actions (Using unified component)
// ============================================================================

function QuickActionsSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  const actions = getQuickActionsByRole("ADMIN", undefined, subdomain)

  return (
    <section>
      <SectionHeading title="Quick Actions" />
      <QuickActions actions={actions} locale={locale} />
    </section>
  )
}

// ============================================================================
// SECTION: Hero Section (Upcoming + Weather)
// ============================================================================

function HeroSection({ locale, subdomain }: { locale: string; subdomain: string }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <Upcoming role="ADMIN" locale={locale} subdomain={subdomain} />
      <Weather />
    </div>
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
  recentActivities,
  todaySummary,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION (Unified Order) ============ */}
      <div className="space-y-6">
        {/* Section 1: Upcoming + Weather */}
        <HeroSection locale={locale} subdomain={subdomain} />

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection locale={locale} subdomain={subdomain} />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="ADMIN" />

        {/* Section 5: Invoice History */}
        <InvoiceHistorySection role="ADMIN" />

        {/* Section 6: Financial Overview */}
        <FinancialOverviewSection role="ADMIN" />
      </div>

      {/* ============ ADMIN-SPECIFIC SECTIONS ============ */}

      {/* Section 7: System Health */}
      <SystemHealthSection />

      {/* Section 8: Quick Stats */}
      <QuickStatsSection quickStats={quickStats} />

      {/* Section 9: Attendance Overview */}
      <AttendanceSection />

      {/* Section 10: Academic Performance */}
      <AcademicPerformanceSection />

      {/* Section 11: Recent Activity */}
      <RecentActivitySection recentActivities={recentActivities} todaySummary={todaySummary} />

      {/* Section 12: School Statistics Summary */}
      <SchoolStatsSummary />
    </div>
  )
}
