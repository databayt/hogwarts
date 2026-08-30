"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { format, isToday, isTomorrow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { QuickLookData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { ChartSection } from "./chart-section"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { ScheduleItem } from "./schedule-item"
import { SectionHeading } from "./section-heading"
import type { TeacherDashboardData } from "./types"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import type { WeatherData } from "./weather-actions"

// ============================================================================
// TYPES
// ============================================================================

export interface TeacherDashboardClientProps {
  locale: string
  subdomain: string
  data: TeacherDashboardData
  quickLookData?: QuickLookData
  weatherData?: WeatherData | null
}

/** Everything the teacher sections read out of `school.teacherDashboard`. */
function useTeacherDict() {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.teacherDashboard
  return {
    stats: dict?.stats,
    sections: dict?.sections,
    labels: dict?.labels,
    progressCards: dict?.progressCards,
    quickActionsTitle: dict?.quickActions?.title,
    teachingProgress: dict?.teachingProgress,
  }
}

// ============================================================================
// SECTION: Hero (Upcoming + Weather)
// ============================================================================

function HeroSection({
  locale,
  subdomain,
  weatherData,
}: {
  locale: string
  subdomain: string
  weatherData?: WeatherData | null
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <Upcoming role="TEACHER" locale={locale} subdomain={subdomain} />
      <Weather
        current={weatherData?.current}
        forecast={weatherData?.forecast}
        location={weatherData?.location}
        className="lg:w-auto lg:max-w-sm lg:min-w-[280px] lg:self-end"
      />
    </div>
  )
}

// ============================================================================
// SECTION: Quick Actions
// ============================================================================

function QuickActionsSection({
  locale,
  subdomain,
}: {
  locale: string
  subdomain: string
}) {
  const { quickActionsTitle } = useTeacherDict()
  const actions = getQuickActionsByRole("TEACHER", subdomain || undefined)

  return (
    <section>
      <SectionHeading title={quickActionsTitle || "Quick Actions"} />
      <QuickActions actions={actions} locale={locale} />
    </section>
  )
}

// ============================================================================
// SECTION: Key Metrics
// ============================================================================

function MetricsSection({
  locale,
  data,
}: {
  locale: string
  data: TeacherDashboardData
}) {
  const { stats } = useTeacherDict()

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        title={stats?.todaysClasses || "Today's Classes"}
        value={data.todaysClasses.length}
        iconName="BookOpen"
        iconColor="text-blue-500"
        href={`/${locale}/subjects`}
      />
      <MetricCard
        title={stats?.totalStudents || "Total Students"}
        value={data.totalStudents}
        iconName="Users"
        iconColor="text-purple-500"
        href={`/${locale}/students`}
      />
      <MetricCard
        title={stats?.pendingGrading || "Pending Grading"}
        value={data.pendingGrading}
        iconName="FileText"
        iconColor={
          data.pendingGrading > 5 ? "text-destructive" : "text-orange-500"
        }
        href={`/${locale}/assignments`}
      />
      <MetricCard
        title={stats?.attendanceDue || "Attendance Due"}
        value={data.attendanceDue}
        iconName="CheckCircle"
        iconColor={data.attendanceDue > 0 ? "text-amber-500" : "text-green-500"}
        href={`/${locale}/attendance`}
      />
    </div>
  )
}

// ============================================================================
// SECTION: Today's Classes + Activity Rings
// ============================================================================

function TodaySection({
  locale,
  data,
}: {
  locale: string
  data: TeacherDashboardData
}) {
  const { sections, labels, teachingProgress } = useTeacherDict()
  const dateLocale = locale === "ar" ? ar : enUS

  const activityData = [
    {
      label: labels?.classesLabel || "Classes",
      value: Math.min(100, (data.todaysClasses.length / 8) * 100),
      color: "#3b82f6",
      current: data.todaysClasses.length,
      target: 8,
      unit: labels?.todayUnit || "today",
    },
    {
      label: labels?.gradingLabel || "Grading",
      value: Math.max(0, 100 - data.pendingGrading * 10),
      color: data.pendingGrading > 5 ? "#ef4444" : "#22c55e",
      current: data.pendingGrading,
      target: 0,
      unit: labels?.pendingUnit || "pending",
    },
    {
      label: labels?.studentsLabel || "Students",
      value: 100,
      color: "#8b5cf6",
      current: data.totalStudents,
      target: data.totalStudents,
      unit: labels?.totalUnit || "total",
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {sections?.todaysClasses || "Today's Classes"}
          </CardTitle>
          <Badge variant="outline">
            {format(new Date(), "EEEE, MMM d", { locale: dateLocale })}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.todaysClasses.length > 0 ? (
            data.todaysClasses.map((cls, index) => (
              <ScheduleItem
                key={cls.id}
                time={cls.time}
                title={cls.name}
                subtitle={`${labels?.room || "Room"} ${cls.room} • ${cls.students} ${labels?.students || "students"}`}
                badge={index === 0 ? labels?.next || "Next" : undefined}
                badgeVariant={index === 0 ? "default" : "secondary"}
                isActive={index === 0}
              />
            ))
          ) : (
            <EmptyState
              iconName="Calendar"
              title={labels?.noClasses || "No classes scheduled for today"}
              description={labels?.enjoyDayOff || "Enjoy your day off!"}
            />
          )}
        </CardContent>
      </Card>

      <ActivityRings
        activities={activityData}
        title={teachingProgress || "Teaching Progress"}
      />
    </div>
  )
}

// ============================================================================
// SECTION: Assignments, Performance, Deadlines
// ============================================================================

function DetailSection({
  locale,
  data,
}: {
  locale: string
  data: TeacherDashboardData
}) {
  const { sections, labels } = useTeacherDict()
  const dateLocale = locale === "ar" ? ar : enUS

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Pending assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {sections?.pendingAssignments || "Pending Assignments"}
          </CardTitle>
          <Link
            href={`/${locale}/assignments`}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            {labels?.viewAll || "View all"}{" "}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.pendingAssignments.length > 0 ? (
            data.pendingAssignments.slice(0, 4).map((assignment) => {
              const dueDate = new Date(assignment.dueDate)
              const isOverdue = dueDate < new Date()
              const isDueToday = isToday(dueDate)
              const isDueTomorrow = isTomorrow(dueDate)

              return (
                <div
                  key={assignment.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{assignment.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {assignment.className} • {assignment.submissionsCount}{" "}
                      {labels?.submissions || "submissions"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isOverdue
                        ? "destructive"
                        : isDueToday
                          ? "default"
                          : isDueTomorrow
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {isOverdue
                      ? labels?.overdue || "Overdue"
                      : isDueToday
                        ? labels?.dueToday || "Due Today"
                        : isDueTomorrow
                          ? labels?.tomorrow || "Tomorrow"
                          : format(dueDate, "MMM d", { locale: dateLocale })}
                  </Badge>
                </div>
              )
            })
          ) : (
            <EmptyState
              iconName="FileText"
              title={labels?.noPending || "No pending assignments"}
              description={
                labels?.allGraded || "All assignments have been graded"
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Class performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            {sections?.classPerformance || "Class Performance Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.classPerformance.length > 0 ? (
            data.classPerformance.slice(0, 4).map((cls, index) => (
              <div
                key={index}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div>
                  <p className="font-medium">{cls.className}</p>
                  <p className="text-muted-foreground text-sm">
                    {labels?.average || "Average"}: {cls.average.toFixed(1)}%
                  </p>
                </div>
                <Badge
                  variant={
                    cls.average >= 80
                      ? "default"
                      : cls.average >= 60
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    cls.average >= 80
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : ""
                  }
                >
                  {cls.average >= 80
                    ? labels?.excellent || "Excellent"
                    : cls.average >= 60
                      ? labels?.good || "Good"
                      : labels?.needsAttention || "Needs Attention"}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState
              iconName="GraduationCap"
              title={
                labels?.noPerformanceData || "No performance data available"
              }
              description={
                labels?.performanceAfterAssessments ||
                "Performance data will appear after assessments"
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Upcoming deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {sections?.upcomingDeadlines || "Upcoming Deadlines"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.upcomingDeadlines.length > 0 ? (
            data.upcomingDeadlines.slice(0, 4).map((deadline) => {
              const dueDate = new Date(deadline.dueDate)
              const daysLeft = Math.ceil(
                (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )

              return (
                <div
                  key={deadline.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{deadline.task}</p>
                    <p className="text-muted-foreground text-sm">
                      {labels?.due || "Due"}:{" "}
                      {format(dueDate, "MMM d, yyyy", { locale: dateLocale })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      daysLeft <= 2
                        ? "destructive"
                        : daysLeft <= 7
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {daysLeft <= 0
                      ? labels?.today || "Today"
                      : daysLeft === 1
                        ? labels?.oneDay || "1 day"
                        : `${daysLeft} ${labels?.days || "days"}`}
                  </Badge>
                </div>
              )
            })
          ) : (
            <EmptyState
              iconName="Clock"
              title={labels?.noDeadlines || "No upcoming deadlines"}
              description={
                labels?.noDeadlinesWorry ||
                "No upcoming deadlines to worry about"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SECTION: Progress
// ============================================================================

function ProgressSection({ data }: { data: TeacherDashboardData }) {
  const { progressCards } = useTeacherDict()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProgressCard
        title={progressCards?.gradingProgress || "Grading Progress"}
        current={Math.max(
          0,
          data.pendingAssignments.length - data.pendingGrading
        )}
        total={Math.max(data.pendingAssignments.length, 1)}
        unit={progressCards?.graded || "graded"}
        iconName="CheckCircle"
        showPercentage
      />
      <ProgressCard
        title={progressCards?.attendanceTaken || "Attendance Taken"}
        // `attendanceDue` can exceed today's slots (it counts every class still
        // owing a register, not just today's), so floor it — a negative
        // "taken" count rendered as -1 of 3.
        current={Math.max(0, data.todaysClasses.length - data.attendanceDue)}
        total={Math.max(data.todaysClasses.length, 1)}
        unit={progressCards?.classes || "classes"}
        iconName="Calendar"
        showPercentage
      />
    </div>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function TeacherDashboardClient({
  locale,
  subdomain,
  data,
  quickLookData,
  weatherData,
}: TeacherDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION (Unified Order) ============ */}
      <div className="space-y-6">
        {/* Section 1: Upcoming + Weather */}
        <HeroSection
          locale={locale}
          subdomain={subdomain}
          weatherData={weatherData}
        />

        {/* Section 2: Quick Look (with real data) */}
        <QuickLookSection
          locale={locale}
          subdomain={subdomain}
          data={quickLookData}
        />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="TEACHER" />

        {/* Section 5: Invoice History (Expense Claims) */}
        <InvoiceHistorySection role="TEACHER" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="TEACHER" />
      </div>

      {/* ============ TEACHER-SPECIFIC SECTIONS ============ */}
      <MetricsSection locale={locale} data={data} />
      <TodaySection locale={locale} data={data} />
      <DetailSection locale={locale} data={data} />
      <ProgressSection data={data} />
    </div>
  )
}
