"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { QuickLookData } from "./actions"
import { ChartSection } from "./chart-section"
import { periodLabel, periodMinutes, useNowMinutes } from "./day-clock"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
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
    // From `md` up only — below it the phone dashboard shows this same
    // section near the top instead (`phone-quick-actions.tsx`), where a
    // thumb reaches it; two copies at once would be the same four tiles twice.
    <section className="hidden md:block">
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
  data: StudentDashboardData
}) {
  const { stats } = useStudentDict()

  // One tile left. Average grade, assignments due and attendance were all
  // removed at the reader's request, and the grades/tasks rings and the
  // performance gauge with them — see the block README. What remains counts
  // today's classes, and only from `md` up: the phone dashboard opens with the
  // real day grid (`today-timetable.tsx`), which shows those classes
  // themselves, and on a weekend the grid falls forward to the next school day
  // while this tile would still read 0 for today.
  return (
    <div className="hidden gap-4 md:grid md:grid-cols-3">
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
// SECTION: Today's Schedule
// ============================================================================

function TodaySection({
  locale,
  data,
}: {
  locale: string
  data: StudentDashboardData
}) {
  const { sections, labels, liveClasses } = useStudentDict()
  const dateLocale = locale === "ar" ? ar : enUS
  const nowMin = useNowMinutes()

  // What is LEFT of the day. A period drops off the moment it ENDS, not when
  // it starts — a class in progress is the one row the student most needs.
  // Before the clock is known (server render, first paint) the whole day
  // stands: see `useNowMinutes`.
  const remaining =
    nowMin === null
      ? data.todaysTimetable
      : data.todaysTimetable.filter(
          (entry) => periodMinutes(entry.endTime) > nowMin
        )

  // Told apart from a genuine day off, which is the same empty list with a
  // very different meaning: "enjoy your day off" at 4pm after a full timetable
  // reads as a bug.
  const dayIsDone = data.todaysTimetable.length > 0 && remaining.length === 0

  // Hidden below `md`. The phone dashboard opens with the real day grid
  // (`today-timetable.tsx`, the timetable page's own day mode), and this card
  // lists the same periods a screen further down — the same day twice, in two
  // different shapes, which teaches the reader to trust neither. From `md` up
  // there is no grid, so this card is the student's only schedule and stays.
  // It used to share a three-column row with the activity rings, which are
  // gone; the row went with them and the card now stands on its own.
  return (
    <Card className="hidden md:block">
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
        {remaining.length > 0 ? (
          remaining.map((entry, index) => {
            // "Now" is a claim about the clock, so only a period the clock
            // is actually inside may make it. Everything else is at most
            // "Next", and only the first row of what is left can be that.
            const isNow =
              nowMin !== null &&
              nowMin >= periodMinutes(entry.startTime) &&
              nowMin < periodMinutes(entry.endTime)
            const isNext = !isNow && nowMin !== null && index === 0

            return (
              <ScheduleItem
                key={entry.id}
                time={periodLabel(entry.startTime)}
                title={entry.subject}
                subtitle={`${labels?.room || "Room"} ${entry.room} • ${entry.teacher}`}
                badge={
                  isNow
                    ? labels?.now || "Now"
                    : isNext
                      ? labels?.next || "Next"
                      : undefined
                }
                badgeVariant={isNow ? "default" : "secondary"}
                isActive={isNow}
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
            )
          })
        ) : dayIsDone ? (
          <EmptyState
            iconName="CheckCircle"
            title={labels?.classesDone || "Classes are done for today"}
            description={labels?.seeYouTomorrow || "See you tomorrow!"}
          />
        ) : (
          <EmptyState
            iconName="Calendar"
            title={labels?.noClasses || "No classes scheduled for today"}
            description={labels?.enjoyDayOff || "Enjoy your day off!"}
          />
        )}
      </CardContent>
    </Card>
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
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION (Unified Order) ============ */}
      <div className="space-y-6">
        {/* Sections 1 and 2 (Upcoming + Weather hero, and the Quick Look row
            of announcements / events / notifications / messages) are hidden on
            the student dashboard. Restore by un-commenting here and passing
            `quickLookData` / `weatherData` again from `student.tsx`. */}
        {/* <HeroSection
          locale={locale}
          subdomain={subdomain}
          weatherData={weatherData}
        />
        <QuickLookSection
          locale={locale}
          subdomain={subdomain}
          data={quickLookData}
        /> */}

        {/* Section 3: Quick Actions (4 focused actions) */}
        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Section 4: Analytics Charts. Directly under the quick actions, ahead
            of the two tables, since 2026-09-09. On phones that row is the one
            `phone-quick-actions.tsx` renders further up, so this is the first
            section of this file the student meets at either width. */}
        <ChartSection role="STUDENT" />

        {/* Section 5: Resource Usage */}
        <ResourceUsageSection role="STUDENT" />

        {/* Section 6: Invoice History */}
        <InvoiceHistorySection role="STUDENT" />
      </div>

      {/* ============ STUDENT-SPECIFIC SECTIONS ============ */}
      {/* Both are `md`-and-up only, so below that the student dashboard is the
          phone experience above plus the sections in the block ahead of it.
          The performance gauge, upcoming assignments, recent grades and school
          announcements that stood here were removed 2026-09-09; `data` still
          carries all three lists, so restoring them is putting the JSX back. */}
      <MetricsSection locale={locale} data={data} />
      <TodaySection locale={locale} data={data} />
    </div>
  )
}
