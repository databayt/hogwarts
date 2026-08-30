"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { differenceInDays, format, isToday, isTomorrow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Bell, ChevronRight, Clock, FileText, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { QuickLookData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { AnnouncementCard } from "./announcement-card"
import { ChartSection } from "./chart-section"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { PerformanceGauge } from "./performance-gauge"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { ScheduleItem } from "./schedule-item"
import { SectionHeading } from "./section-heading"
import { TodayLiveAction } from "./today-live-action"
import type { StudentDashboardData } from "./types"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import type { WeatherData } from "./weather-actions"

// ============================================================================
// TYPES
// ============================================================================

export interface StudentDashboardClientProps {
  locale: string
  subdomain: string
  data: StudentDashboardData
  quickLookData?: QuickLookData
  weatherData?: WeatherData | null
}

/** Everything the student sections read out of `school.studentDashboard`. */
function useStudentDict() {
  const { dictionary } = useDictionary()
  const school = dictionary?.school
  const dict = school?.studentDashboard
  return {
    stats: dict?.stats,
    sections: dict?.sections,
    labels: dict?.labels,
    quickActionsTitle: dict?.quickActions?.title,
    liveClasses: school?.liveClasses,
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
      <Upcoming role="STUDENT" locale={locale} subdomain={subdomain} />
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
  const { quickActionsTitle } = useStudentDict()
  const actions = getQuickActionsByRole("STUDENT", subdomain || undefined)

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
  averageGrade,
}: {
  locale: string
  data: StudentDashboardData
  averageGrade: number
}) {
  const { stats, labels } = useStudentDict()
  const attendance = data.attendanceSummary

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        title={stats?.attendance || "Attendance"}
        value={`${attendance.percentage.toFixed(0)}%`}
        description={`${attendance.presentDays}/${attendance.totalDays} ${labels?.daysUnit || "days"}`}
        iconName="Calendar"
        iconColor={
          attendance.percentage >= 85 ? "text-green-500" : "text-amber-500"
        }
        href={`/${locale}/attendance`}
      />
      <MetricCard
        title={stats?.averageGrade || "Average Grade"}
        value={
          averageGrade > 0 ? `${averageGrade.toFixed(0)}%` : labels?.na || "N/A"
        }
        iconName="GraduationCap"
        iconColor={
          averageGrade >= 80
            ? "text-green-500"
            : averageGrade >= 60
              ? "text-blue-500"
              : "text-amber-500"
        }
        href={`/${locale}/grades`}
      />
      <MetricCard
        title={stats?.assignmentsDue || "Assignments Due"}
        value={data.upcomingAssignments.length}
        iconName="FileText"
        iconColor={
          data.upcomingAssignments.length > 3
            ? "text-destructive"
            : "text-purple-500"
        }
        href={`/${locale}/assignments`}
      />
      <MetricCard
        title={stats?.classesToday || "Classes Today"}
        value={data.todaysTimetable.length}
        iconName="BookOpen"
        iconColor="text-blue-500"
        href={`/${locale}/timetable`}
      />
    </div>
  )
}

// ============================================================================
// SECTION: Today's Schedule + Activity Rings
// ============================================================================

function TodaySection({
  locale,
  data,
  averageGrade,
}: {
  locale: string
  data: StudentDashboardData
  averageGrade: number
}) {
  const { sections, labels, liveClasses } = useStudentDict()
  const dateLocale = locale === "ar" ? ar : enUS
  const attendance = data.attendanceSummary

  const activityData = [
    {
      label: labels?.attendanceRing || "Attendance",
      value: attendance.percentage,
      color: attendance.percentage >= 85 ? "#22c55e" : "#f59e0b",
      current: attendance.presentDays,
      target: attendance.totalDays,
      unit: labels?.daysUnit || "days",
    },
    {
      label: labels?.gradesRing || "Grades",
      value: averageGrade,
      color:
        averageGrade >= 80
          ? "#22c55e"
          : averageGrade >= 60
            ? "#3b82f6"
            : "#ef4444",
      current: Math.round(averageGrade),
      target: 100,
      unit: labels?.percentUnit || "%",
    },
    {
      label: labels?.tasksRing || "Tasks",
      value: Math.max(0, 100 - data.upcomingAssignments.length * 20),
      color: "#8b5cf6",
      current: data.upcomingAssignments.length,
      target: 5,
      unit: labels?.dueUnit || "due",
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {sections?.todaySchedule || "Today's Schedule"}
          </CardTitle>
          <Badge variant="outline">
            {format(new Date(), "EEEE, MMM d", { locale: dateLocale })}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.todaysTimetable.length > 0 ? (
            data.todaysTimetable.map((entry, index) => (
              <ScheduleItem
                key={entry.id}
                time={format(new Date(entry.startTime), "HH:mm")}
                title={entry.subject}
                subtitle={`${labels?.room || "Room"} ${entry.room} • ${entry.teacher}`}
                badge={index === 0 ? labels?.now || "Now" : undefined}
                badgeVariant={index === 0 ? "default" : "secondary"}
                isActive={index === 0}
                // Join from the home page too — the room is still where the
                // class meets; online is additive, so the marker sits beside it.
                action={
                  <TodayLiveAction
                    liveClass={entry.liveClass}
                    startTime={entry.startTime}
                    endTime={entry.endTime}
                    lang={locale as Locale}
                    joinLabel={
                      liveClasses?.join ?? (locale === "ar" ? "انضمام" : "Join")
                    }
                    onlineLabel={
                      liveClasses?.online ??
                      (locale === "ar" ? "مباشر" : "Online")
                    }
                  />
                }
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
        title={sections?.myProgress || "My Progress"}
      />
    </div>
  )
}

// ============================================================================
// SECTION: Performance, Assignments, Grades, Announcements
// ============================================================================

function DetailSection({
  locale,
  data,
  averageGrade,
}: {
  locale: string
  data: StudentDashboardData
  averageGrade: number
}) {
  const { sections, labels } = useStudentDict()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PerformanceGauge
        value={Math.round(averageGrade)}
        label={labels?.averageLabel || "Average"}
        description={
          labels?.performanceDescription || "Current academic performance"
        }
        color={
          averageGrade >= 80 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"
        }
      />

      {/* Upcoming assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {sections?.upcomingAssignments || "Upcoming Assignments"}
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
          {data.upcomingAssignments.length > 0 ? (
            data.upcomingAssignments.slice(0, 4).map((assignment) => {
              const dueDate = new Date(assignment.dueDate)
              const isDueToday = isToday(dueDate)
              const isDueTomorrow = isTomorrow(dueDate)
              const daysUntil = differenceInDays(dueDate, new Date())
              const isOverdue = daysUntil < 0

              return (
                <div
                  key={assignment.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{assignment.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {assignment.subject} • {assignment.className}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isOverdue || assignment.status === "NOT_SUBMITTED"
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
                          : `${daysUntil} ${labels?.days || "days"}`}
                  </Badge>
                </div>
              )
            })
          ) : (
            <EmptyState
              iconName="FileText"
              title={labels?.noAssignments || "No upcoming assignments"}
              description={labels?.allCaughtUp || "You're all caught up!"}
            />
          )}
        </CardContent>
      </Card>

      {/* Recent grades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            {sections?.recentGrades || "Recent Grades"}
          </CardTitle>
          <Link
            href={`/${locale}/grades`}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            {labels?.viewAll || "View all"}{" "}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentGrades.length > 0 ? (
            data.recentGrades.slice(0, 4).map((grade) => (
              <div
                key={grade.id}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{grade.examTitle}</p>
                  <p className="text-muted-foreground text-sm">
                    {grade.subject}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-bold">
                    {grade.marksObtained}/{grade.totalMarks}
                  </p>
                  <Badge
                    variant={
                      grade.percentage >= 80
                        ? "default"
                        : grade.percentage >= 60
                          ? "secondary"
                          : "destructive"
                    }
                    className={
                      grade.percentage >= 80
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : ""
                    }
                  >
                    {grade.percentage.toFixed(0)}%
                    {grade.grade ? ` • ${grade.grade}` : ""}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              iconName="Trophy"
              title={labels?.noGrades || "No recent grades"}
              description={
                labels?.gradesAfterAssessments ||
                "Grades will appear here after assessments"
              }
            />
          )}
        </CardContent>
      </Card>

      {/* School announcements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            {sections?.announcements || "School Announcements"}
          </CardTitle>
          <Badge variant="secondary">
            {data.announcements.length} {labels?.new || "new"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.announcements.length > 0 ? (
            data.announcements
              .slice(0, 3)
              .map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  title={announcement.title}
                  content={announcement.body}
                  date={announcement.createdAt}
                  priority={index === 0 ? "high" : "normal"}
                />
              ))
          ) : (
            <EmptyState
              iconName="Bell"
              title={labels?.noAnnouncements || "No announcements"}
              description={
                labels?.announcementsHere ||
                "New announcements will appear here"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function StudentDashboardClient({
  locale,
  subdomain,
  data,
  quickLookData,
  weatherData,
}: StudentDashboardClientProps) {
  const averageGrade =
    data.recentGrades.length > 0
      ? data.recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
        data.recentGrades.length
      : 0

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
        <ResourceUsageSection role="STUDENT" />

        {/* Section 5: Invoice History */}
        <InvoiceHistorySection role="STUDENT" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="STUDENT" />
      </div>

      {/* ============ STUDENT-SPECIFIC SECTIONS ============ */}
      <MetricsSection locale={locale} data={data} averageGrade={averageGrade} />
      <TodaySection locale={locale} data={data} averageGrade={averageGrade} />
      <DetailSection locale={locale} data={data} averageGrade={averageGrade} />
    </div>
  )
}
