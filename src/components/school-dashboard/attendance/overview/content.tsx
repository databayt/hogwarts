"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Today — the admin/staff landing. One question per block, top to bottom:
 * how far along is today's marking, what are today's figures, which sections
 * still need marking, who needs attention, and what is waiting for review.
 * Navigation lives in the tabs above, so there is no tile grid here.
 */
import { Fragment, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { CalendarOff, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"

import { getFollowUpStudents, getTodaysDashboard } from "../actions"
import { getPendingIntentionsCount } from "../intentions/actions"
import type { AttendanceFollowUp, TodaysAttendanceDashboard } from "../queries"
import { ClockCard } from "../quick/clock-card"
import { fill, formatCount, formatDay, plural } from "./format"

interface AttendanceOverviewContentProps {
  locale: Locale
  subdomain: string
  role?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

const VISIBLE_SECTIONS = 6

/** Render a "{a} of {b}" template with React nodes in the slots. */
function renderTemplate(
  template: string,
  slots: Record<string, React.ReactNode>
): React.ReactNode {
  const parts = template.split(/(\{\w+\})/g)
  return parts.map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/)
    return <Fragment key={i}>{m ? (slots[m[1]] ?? part) : part}</Fragment>
  })
}

export function AttendanceOverviewContent({
  locale,
}: AttendanceOverviewContentProps) {
  const { dictionary } = useDictionary()
  const t = ((dictionary as Dict | undefined)?.attendanceToday?.today ??
    {}) as Dict
  const d = dictionary?.school?.attendance as Dict | undefined
  const [isPending, startTransition] = useTransition()
  const [dashboard, setDashboard] = useState<TodaysAttendanceDashboard | null>(
    null
  )
  const [followUp, setFollowUp] = useState<AttendanceFollowUp | null>(null)
  const [pendingIntentions, setPendingIntentions] = useState<number | null>(
    null
  )
  const [failed, setFailed] = useState(false)
  const [showAllSections, setShowAllSections] = useState(false)

  const basePath = `/${locale}/attendance`

  function loadData() {
    setFailed(false)
    startTransition(async () => {
      const fail = { success: false as const, error: "" }
      const [dash, follow, intentions] = await Promise.all([
        getTodaysDashboard().catch(() => fail),
        getFollowUpStudents({ limit: 5 }).catch(() => fail),
        getPendingIntentionsCount().catch(() => fail),
      ])
      if (dash.success && dash.data) setDashboard(dash.data)
      else setFailed(true)
      if (follow.success && follow.data) setFollowUp(follow.data)
      if (intentions.success && intentions.data)
        setPendingIntentions(intentions.data.count)
    })
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loading = isPending && !dashboard
  const stats = dashboard?.stats
  const isSchoolDay = dashboard?.today.isSchoolDay ?? true
  const total = stats?.classesTotal ?? 0
  const marked = stats?.classesMarked ?? 0
  const progress = total ? Math.round((marked / total) * 100) : 0
  const unmarked = dashboard?.unmarkedClasses ?? []
  const visibleUnmarked = showAllSections
    ? unmarked
    : unmarked.slice(0, VISIBLE_SECTIONS)
  const n = (v: number) => formatCount(v, locale)

  // The heading date is the school's calendar day the server computed.
  const dateLabel = dashboard
    ? formatDay(dashboard.today.date, locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  if (failed && !dashboard) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          {t.loadFailed ?? "Today's attendance couldn't load."}
        </p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => loadData()}
          disabled={isPending}
        >
          {t.retry ?? "Try again"}
        </Button>
      </div>
    )
  }

  const figures = [
    {
      key: "present",
      label: t.present ?? "Present",
      value: n(stats?.present ?? 0),
      tone: "text-foreground",
    },
    {
      key: "absent",
      label: t.absent ?? "Absent",
      value: n(stats?.absent ?? 0),
      tone: (stats?.absent ?? 0) > 0 ? "text-destructive" : "text-foreground",
    },
    {
      key: "late",
      label: t.late ?? "Late",
      value: n(stats?.late ?? 0),
      tone:
        (stats?.late ?? 0) > 0
          ? "text-amber-600 dark:text-amber-500"
          : "text-foreground",
    },
    {
      key: "rate",
      label: t.rate ?? "Rate",
      value: `${n(stats?.attendanceRate ?? 0)}%`,
      tone: "text-foreground",
    },
  ]

  return (
    <div className="max-w-3xl space-y-10">
      {/* Date — the one quiet heading line; the layout carries the H1. */}
      <div className="text-muted-foreground text-sm">
        {loading || !dateLabel ? (
          <Skeleton className="inline-block h-4 w-48 align-middle" />
        ) : (
          dateLabel
        )}
      </div>

      {/* Marking progress */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ) : isSchoolDay ? (
        <section className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {t.sectionsMarked ?? "Sections marked"}
          </p>
          <p className="text-muted-foreground text-xl">
            {renderTemplate(t.ofTotal ?? "{marked} of {total}", {
              marked: (
                <bdi className="text-foreground text-5xl font-semibold tracking-tight tabular-nums">
                  {n(marked)}
                </bdi>
              ),
              total: <bdi className="tabular-nums">{n(total)}</bdi>,
            })}
          </p>
          <Progress
            value={progress}
            className="h-1.5"
            aria-label={t.sectionsMarked ?? "Sections marked"}
          />
          {total > 0 && marked === total ? (
            <p className="text-muted-foreground text-sm">
              {t.allMarked ?? "Every section is marked for today."}
            </p>
          ) : null}
          {total === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t.noSections ?? "No sections with students yet."}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="bg-muted/50 flex items-center gap-3 rounded-2xl px-4 py-4">
          <CalendarOff className="text-muted-foreground size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {t.noSchool ?? "No school today"}
            </p>
            <p className="text-muted-foreground text-xs">
              {t.noSchoolDesc ??
                "Today isn't a school day, so no attendance is expected."}
            </p>
          </div>
        </section>
      )}

      {/* Today's figures */}
      <section className="bg-card grid grid-cols-2 overflow-hidden rounded-2xl border sm:grid-cols-4">
        {figures.map((f, i) => (
          <div
            key={f.key}
            className={cn(
              "space-y-1 px-4 py-4",
              i % 2 === 1 && "border-s",
              i >= 2 && "max-sm:border-t",
              i >= 1 && "sm:border-s"
            )}
          >
            <p className="text-muted-foreground text-xs">{f.label}</p>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight tabular-nums",
                  f.tone
                )}
              >
                <bdi>{f.value}</bdi>
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Sections still to mark */}
      {unmarked.length > 0 ? (
        <SettingsGroup
          title={
            <span className="flex items-center justify-between gap-2">
              <span>{t.toMark ?? "Still to mark"}</span>
              <span className="tabular-nums">{n(unmarked.length)}</span>
            </span>
          }
          footer={
            unmarked.length > VISIBLE_SECTIONS ? (
              <button
                type="button"
                onClick={() => setShowAllSections((v) => !v)}
                className="text-primary font-medium hover:underline"
              >
                {showAllSections
                  ? (t.showLess ?? "Show less")
                  : `${t.showAll ?? "Show all"} (${n(unmarked.length)})`}
              </button>
            ) : undefined
          }
        >
          {visibleUnmarked.map((section) => (
            <SettingsRow
              key={section.id}
              label={section.name}
              description={[
                section.teacherName ?? t.noTeacher ?? "No homeroom teacher",
                plural(t.students, section.studentCount, locale),
              ].join(" · ")}
            >
              <Button asChild size="sm" className="rounded-full px-4">
                <Link href={`${basePath}/manual?sectionId=${section.id}`}>
                  {t.mark ?? "Mark"}
                </Link>
              </Button>
            </SettingsRow>
          ))}
        </SettingsGroup>
      ) : null}

      {/* Needs attention */}
      {followUp && followUp.students.length > 0 ? (
        <SettingsGroup
          title={
            <span className="flex items-center justify-between gap-2">
              <span>{t.attention ?? "Needs attention"}</span>
              <Link
                href={`${basePath}/early-warning`}
                className="text-primary hover:underline"
              >
                {t.seeAll ?? "See all"}
              </Link>
            </span>
          }
        >
          {followUp.students.slice(0, 5).map((student, idx) => {
            const detail =
              student.issue === "consecutive_absence" && student.count != null
                ? plural(t.absentStreak, student.count, locale)
                : student.issue === "unexcused_pending" && student.date
                  ? fill(t.excusePending, {
                      date: formatDay(student.date, locale),
                    })
                  : student.details
            const href = student.actionUrl
              ? `/${locale}${student.actionUrl}`
              : `${basePath}/early-warning`
            return (
              <Link
                key={`${student.studentId}-${idx}`}
                href={href}
                className="hover:bg-muted/50 flex min-h-12 items-center gap-3 px-4 py-3 transition-colors"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    student.severity === "critical"
                      ? "bg-destructive"
                      : student.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-muted-foreground/40"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {student.studentName}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {[student.className, detail].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0 rtl:rotate-180" />
              </Link>
            )
          })}
        </SettingsGroup>
      ) : null}

      {/* Waiting for review */}
      {dashboard ? (
        <SettingsGroup title={t.waiting ?? "Waiting for review"}>
          {[
            {
              key: "excuses",
              href: `${basePath}/excuses`,
              label: t.excusesWaiting ?? d?.excuses ?? "Excuses",
              count: dashboard.stats.pendingExcuses,
            },
            ...(pendingIntentions != null
              ? [
                  {
                    key: "intentions",
                    href: `${basePath}/intentions`,
                    label: t.intentionsWaiting ?? "Planned absences",
                    count: pendingIntentions,
                  },
                ]
              : []),
          ].map((row) => (
            <Link
              key={row.key}
              href={row.href}
              className="hover:bg-muted/50 flex min-h-12 items-center gap-3 px-4 py-3 transition-colors"
            >
              <span className="flex-1 text-sm font-medium">{row.label}</span>
              <span
                className={cn(
                  "min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-medium tabular-nums",
                  row.count > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {n(row.count)}
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0 rtl:rotate-180" />
            </Link>
          ))}
        </SettingsGroup>
      ) : null}

      {/* Personal check-in/out — renders only for users with a staff identity */}
      <ClockCard locale={locale} dictionary={d?.quick?.clock} />
    </div>
  )
}
