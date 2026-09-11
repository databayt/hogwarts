"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Calendar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { type Locale } from "@/components/internationalization/config"

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
  const school = dictionary?.school
  const dict = school?.teacherDashboard
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
  data: TeacherDashboardData
}) {
  const { stats } = useTeacherDict()

  // One tile left, matching the student dashboard (2026-09-10). Total
  // students, pending grading and attendance due were dropped with the rest of
  // the teacher's sections; `data` still carries all three numbers, so each
  // comes back by putting its `MetricCard` back. What remains counts today's
  // classes, and only from `md` up: the phone dashboard opens with the real
  // day grid (`today-timetable.tsx`), which shows those classes themselves,
  // and on a weekend the grid falls forward to the next school day while this
  // tile would still read 0 for today.
  return (
    <div className="hidden gap-4 md:grid md:grid-cols-3">
      <MetricCard
        title={stats?.todaysClasses || "Today's Classes"}
        value={data.todaysClasses.length}
        iconName="BookOpen"
        iconColor="text-blue-500"
        href={`/${locale}/subjects`}
      />
    </div>
  )
}

// ============================================================================
// SECTION: Today's Classes
// ============================================================================

function TodaySection({
  locale,
  data,
}: {
  locale: string
  data: TeacherDashboardData
}) {
  const { sections, labels, liveClasses } = useTeacherDict()
  const dateLocale = locale === "ar" ? ar : enUS
  const nowMin = useNowMinutes()

  // What is LEFT of the day. A period drops off the moment it ENDS, not when
  // it starts — a class in progress is the one row the teacher most needs.
  // Before the clock is known (server render, first paint) the whole day
  // stands: see `useNowMinutes`. The metric tile above still counts the FULL
  // day, because that is the question it answers.
  const remaining =
    nowMin === null
      ? data.todaysClasses
      : data.todaysClasses.filter(
          (entry) => periodMinutes(entry.endTime) > nowMin
        )

  // Told apart from a genuine day off, which is the same empty list with a
  // very different meaning: "enjoy your day off" at 4pm after a full timetable
  // reads as a bug.
  const dayIsDone = data.todaysClasses.length > 0 && remaining.length === 0

  // Hidden below `md`. The phone dashboard opens with the real day grid
  // (`today-timetable.tsx`, the timetable page's own day mode), and this card
  // lists the same periods a screen further down — the same day twice, in two
  // different shapes, which teaches the reader to trust neither. From `md` up
  // there is no grid, so this card is the teacher's only schedule and stays.
  // It used to share a three-column row with the Teaching Progress rings,
  // which are gone; the row went with them and the card now stands on its own.
  //
  // Since 2026-09-10 the card clears itself as the day passes, on the same
  // clock as the student's — see `day-clock.ts`, which both import. The
  // teacher and the students in the room now read one day: same
  // school-timezone weekday, same active term, same Join target.
  return (
    <Card className="hidden md:block">
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
          {remaining.length > 0 ? (
            remaining.map((cls, index) => {
              // "Now" is a claim about the clock, so only a period the clock
              // is actually inside may make it. Everything else is at most
              // "Next", and only the first row of what is left can be that.
              // Index 0 used to claim "Next" unconditionally, which read as a
              // class starting imminently at four in the afternoon.
              const isNow =
                nowMin !== null &&
                nowMin >= periodMinutes(cls.startTime) &&
                nowMin < periodMinutes(cls.endTime)
              const isNext = !isNow && nowMin !== null && index === 0

              return (
                <ScheduleItem
                  key={cls.id}
                  time={periodLabel(cls.startTime)}
                  title={cls.name}
                  subtitle={`${labels?.room || "Room"} ${cls.room} • ${cls.students} ${labels?.students || "students"}`}
                  badge={
                    isNow
                      ? labels?.now || "Now"
                      : isNext
                        ? labels?.next || "Next"
                        : undefined
                  }
                  badgeVariant={isNow ? "default" : "secondary"}
                  isActive={isNow}
                  // Start the class from the home page too — the room is still
                  // where it meets; online is additive, so the marker sits
                  // beside it. Same resolver the students see, so neither side
                  // can be looking at a link the other does not have.
                  action={
                    <TodayLiveAction
                      liveClass={cls.liveClass}
                      startTime={cls.startTime}
                      endTime={cls.endTime}
                      lang={locale as Locale}
                      joinLabel={
                        liveClasses?.join ??
                        (locale === "ar" ? "انضمام" : "Join")
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
        {/* Sections 1 and 2 (Upcoming + Weather hero, and the Quick Look row
            of announcements / events / notifications / messages) are hidden on
            the teacher dashboard, matching the student's. Restore by
            un-commenting here and passing `quickLookData` / `weatherData`
            again from `teacher.tsx`. */}
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

        {/* Section 4: Analytics Charts. Directly under the quick actions,
            ahead of the two tables, as on the student dashboard. On phones
            that row is the one `phone-quick-actions.tsx` renders further up,
            so this is the first section of this file the teacher meets at
            either width. */}
        <ChartSection role="TEACHER" />

        {/* Section 5: Resource Usage */}
        <ResourceUsageSection role="TEACHER" />

        {/* Section 6: Invoice History (Expense Claims) */}
        <InvoiceHistorySection role="TEACHER" />
      </div>

      {/* ============ TEACHER-SPECIFIC SECTIONS ============ */}
      {/* Both are `md`-and-up only, so below that the teacher dashboard is the
          phone experience above plus the sections in the block ahead of it.
          The Teaching Progress rings, pending assignments, class performance,
          upcoming deadlines and the two progress bars that stood here were
          removed 2026-09-10; `data` still carries every one of those lists and
          counts, so restoring them is putting the JSX back. */}
      <MetricsSection locale={locale} data={data} />
      <TodaySection locale={locale} data={data} />
    </div>
  )
}
