// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance › Reports › Overview.
 *
 * One filter row (period segmented control + section), four quiet figures
 * from ONE stats read, three charts (daily trend, weekday, method donut),
 * then the section ranking and a link to the at-risk students. Export uses
 * the same filters as the screen, so what you download is what you see.
 *
 * Every read is a server action guarded by `canViewSchoolAnalytics`; the
 * section ranking and at-risk list are teacher-scoped server-side.
 */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { plural } from "@/components/school-dashboard/school/configuration/ui/format"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import {
  getAttendanceStats,
  getAttendanceTrends,
  getDayWisePatterns,
  getMethodUsageStats,
  getSectionComparisonStats,
  getSectionsForSelection,
  getStudentsAtRisk,
} from "../actions"
import { AttendanceReportExportButton } from "../reports/export-button"
import { AttendanceSectionNav } from "../ui/section-nav"
import { DailyTrendChart, MethodDonut, Panel, WeekdayChart } from "./charts"
import { formatPercent } from "./format"

type RangeKey = "week" | "month" | "term"

interface AnalyticsContentProps {
  dictionary?: Dictionary
  locale?: string
  /** The active term's dates (ISO), when the school has one. */
  term?: { from: string; to: string } | null
}

interface Stats {
  total: number
  present: number
  absent: number
  late: number
  attendanceRate: number
}

interface SectionOption {
  id: string
  name: string
  gradeName: string
}

interface SectionStat {
  sectionId: string
  sectionName: string
  studentCount: number
  totalRecords: number
  rate: number
}

function rangeFor(key: RangeKey, term?: { from: string; to: string } | null) {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  if (key === "term" && term) {
    const end = new Date(term.to)
    return { from: new Date(term.from), to: end < to ? end : to }
  }
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - (key === "week" ? 6 : 29))
  return { from, to }
}

export default function AnalyticsContent({
  dictionary,
  locale = "ar",
  term,
}: AnalyticsContentProps) {
  const lang = locale
  const d = dictionary as any
  const t = d?.attendanceReports?.overview ?? {}
  const hub = d?.attendanceHub ?? {}

  const [range, setRange] = useState<RangeKey>("month")
  const [section, setSection] = useState("all")
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<{ date: string; rate: number }[]>([])
  const [weekdays, setWeekdays] = useState<
    { dayIndex: number; rate: number; total: number }[]
  >([])
  const [methods, setMethods] = useState<
    { method: string; count: number; percentage: number }[]
  >([])
  const [sectionStats, setSectionStats] = useState<SectionStat[]>([])
  const [atRisk, setAtRisk] = useState(0)
  const [sections, setSections] = useState<SectionOption[]>([])

  const dates = useMemo(() => rangeFor(range, term), [range, term])

  const load = useCallback(async () => {
    setLoading(true)
    const dateFrom = dates.from.toISOString()
    const dateTo = dates.to.toISOString()
    const sectionId = section !== "all" ? section : undefined
    try {
      const [s, tr, dw, me, sc, ar] = await Promise.all([
        getAttendanceStats({ dateFrom, dateTo, sectionId }),
        getAttendanceTrends({ dateFrom, dateTo, sectionId }),
        getDayWisePatterns({ dateFrom, dateTo, sectionId }),
        getMethodUsageStats({ dateFrom, dateTo }),
        getSectionComparisonStats({ dateFrom, dateTo }),
        getStudentsAtRisk({ threshold: 80, dateFrom, dateTo }),
      ])
      setStats(s)
      // Trends use the ActionResponse envelope ({ success, data }).
      setTrend(
        tr.success && tr.data
          ? tr.data.trends.map((p) => ({ date: p.date, rate: p.rate }))
          : []
      )
      setWeekdays("patterns" in dw && dw.patterns ? dw.patterns : [])
      setMethods("stats" in me && me.stats ? me.stats : [])
      setSectionStats("stats" in sc && sc.stats ? sc.stats : [])
      setAtRisk("students" in ar && ar.students ? ar.students.length : 0)
    } catch (error) {
      console.error("[attendance overview] load failed", error)
    } finally {
      setLoading(false)
    }
  }, [dates, section])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getSectionsForSelection().then((r) => {
      if (r.success && r.data) setSections(r.data.sections)
    })
  }, [])

  const methodRows = useMemo(
    () =>
      methods.map((m) => ({
        ...m,
        label: hub.methods?.[m.method] ?? m.method.replace(/_/g, " "),
      })),
    [methods, hub.methods]
  )

  const rangeOptions = [
    { value: "week" as const, label: t.range?.week ?? "7 days" },
    { value: "month" as const, label: t.range?.month ?? "30 days" },
    ...(term
      ? [{ value: "term" as const, label: t.range?.term ?? "This term" }]
      : []),
  ]

  const selectedSectionName =
    section !== "all" ? sections.find((s) => s.id === section)?.name : undefined

  const noData = t.noData ?? "No attendance recorded in this period."
  const rateLabel = t.kpi?.rate ?? "Attendance rate"
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight

  return (
    <div className="space-y-8">
      <AttendanceSectionNav group="reports" dictionary={dictionary} />

      {/* Filters + the page's one action */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={range}
          onValueChange={setRange}
          options={rangeOptions}
          aria-label={t.rangeLabel ?? "Period"}
        />
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger
            className="w-full rounded-full sm:w-[220px]"
            aria-label={t.sectionLabel ?? "Section"}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.allSections ?? "All sections"}
            </SelectItem>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.gradeName} · {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ms-auto">
          <AttendanceReportExportButton
            filters={{
              sectionId: section !== "all" ? section : undefined,
              from: dates.from.toISOString(),
              to: dates.to.toISOString(),
            }}
            sectionName={selectedSectionName}
            locale={lang}
          />
        </div>
      </div>

      {/* Four figures, one source (getAttendanceStats) */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
        {[
          {
            key: "rate",
            label: rateLabel,
            value: stats ? formatPercent(stats.attendanceRate, lang) : "—",
            sub: stats ? plural(t.records, stats.total, lang) : "",
          },
          {
            key: "present",
            label: t.kpi?.present ?? "Present",
            value: stats?.present,
          },
          {
            key: "absent",
            label: t.kpi?.absent ?? "Absent",
            value: stats?.absent,
          },
          { key: "late", label: t.kpi?.late ?? "Late", value: stats?.late },
        ].map((k) => (
          <div key={k.key} className="space-y-1">
            <dt className="text-muted-foreground text-xs">{k.label}</dt>
            <dd className="text-3xl font-semibold tracking-tight tabular-nums">
              {loading && !stats ? (
                <Skeleton className="h-9 w-20" />
              ) : typeof k.value === "number" ? (
                new Intl.NumberFormat("en-US").format(k.value)
              ) : (
                (k.value ?? "—")
              )}
            </dd>
            {"sub" in k && k.sub ? (
              <p className="text-muted-foreground text-xs">{k.sub}</p>
            ) : null}
          </div>
        ))}
      </dl>

      <div
        className={cn(
          "space-y-6 transition-opacity",
          loading && stats && "opacity-60"
        )}
      >
        <Panel
          title={t.trend?.title ?? "Daily attendance"}
          subtitle={t.trend?.subtitle}
        >
          {loading && !stats ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : (
            <DailyTrendChart
              data={trend}
              lang={lang}
              rateLabel={rateLabel}
              emptyLabel={noData}
            />
          )}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title={t.weekday?.title ?? "By weekday"}
            subtitle={t.weekday?.subtitle}
          >
            {loading && !stats ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : (
              <WeekdayChart
                data={weekdays}
                lang={lang}
                rateLabel={rateLabel}
                emptyLabel={noData}
              />
            )}
          </Panel>
          <Panel
            title={t.methods?.title ?? "How attendance was taken"}
            subtitle={t.methods?.subtitle}
          >
            {loading && !stats ? (
              <Skeleton className="h-[180px] w-full rounded-xl" />
            ) : (
              <MethodDonut data={methodRows} lang={lang} emptyLabel={noData} />
            )}
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section ranking — an inset grouped list */}
          <Panel
            title={t.sections?.title ?? "Sections"}
            subtitle={t.sections?.subtitle}
          >
            {sectionStats.filter((s) => s.totalRecords > 0).length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t.sections?.empty ?? "No section has records in this period."}
              </p>
            ) : (
              <ol className="divide-border/60 -mx-5 -mb-5 divide-y border-t">
                {sectionStats
                  .filter((s) => s.totalRecords > 0)
                  .map((s, i) => (
                    <li
                      key={s.sectionId}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3",
                        s.sectionId === section && "bg-muted/50"
                      )}
                    >
                      <span className="text-muted-foreground w-5 text-xs tabular-nums">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {s.sectionName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {plural(t.sections?.students, s.studentCount, lang)}
                        </p>
                      </div>
                      <div className="flex w-28 items-center gap-2">
                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              s.rate >= 90
                                ? "bg-emerald-500"
                                : s.rate >= 80
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            )}
                            style={{ width: `${s.rate}%` }}
                          />
                        </div>
                        <span className="w-10 text-end text-sm tabular-nums">
                          {s.rate}%
                        </span>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </Panel>

          {/* At-risk students — the detail lives on its own tab */}
          <Panel title={t.atRisk?.title ?? "Students below 80%"}>
            <div className="flex flex-col items-start gap-4 py-2">
              <p className="text-4xl font-semibold tracking-tight tabular-nums">
                {atRisk}
              </p>
              <p className="text-muted-foreground text-sm">
                {atRisk === 0
                  ? (t.atRisk?.none ??
                    "Every student is at 80% or above in this period.")
                  : plural(t.atRisk?.count, atRisk, lang)}
              </p>
              <Link
                href={`/${lang}/attendance/early-warning`}
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                {t.atRisk?.view ?? "View students"}
                <Chevron className="size-4" />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
