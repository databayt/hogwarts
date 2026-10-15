"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Interventions — a quiet stat row, one Segmented status filter + search,
 * and a clean table. `?student=<id>` scopes it to one student (linked from
 * the at-risk list's "…" menu).
 */
import { useCallback, useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { InterventionStatus } from "@prisma/client"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getAllInterventions,
  getInterventionStats,
} from "@/components/school-dashboard/attendance/actions"
import { formatCount } from "@/components/school-dashboard/school/configuration/ui/format"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { BAND_TONE, legacyBand } from "../early-warning/risk"
import {
  pick,
  pl,
  useRiskDict,
  type RiskDict,
} from "../early-warning/use-risk-dict"
import { AttendanceSectionNav } from "../ui/section-nav"
import { INTERVENTION_TYPE_KEYS } from "./create-dialog"

type Filter = "all" | "active" | "completed" | "closed"

const FILTER_STATUSES: Record<Filter, InterventionStatus[] | undefined> = {
  all: undefined,
  active: ["SCHEDULED", "IN_PROGRESS"],
  completed: ["COMPLETED"],
  closed: ["CANCELLED", "ESCALATED"],
}

const STATUS_KEYS: Record<string, string> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ESCALATED: "escalated",
}

const STATUS_TONE: Record<string, string> = {
  SCHEDULED: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  IN_PROGRESS: "bg-amber-400/15 text-amber-700 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground",
  ESCALATED: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const PAGE_SIZE = 15

interface Row {
  id: string
  studentId: string
  studentName: string
  className: string | null
  type: string
  title: string
  status: string
  scheduledDate: string | null
  createdAt: string
  assigneeName: string | null
  riskLevel: string
}

interface Stats {
  byStatus: Array<{ status: string; count: number }>
  successRate: number | null
  averageDaysToComplete: number | null
}

/** Gregorian calendar + Latin digits in both languages (ar-SA defaults to Hijri). */
export function formatDay(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { day: "numeric", month: "short", year: "numeric" }
  ).format(new Date(iso))
}

function fmt1(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    numberingSystem: "latn",
    maximumFractionDigits: 1,
  }).format(n)
}

export function InterventionsContent({ locale = "ar" }: { locale?: string }) {
  const lang = locale
  const router = useRouter()
  const pathname = usePathname()
  const studentId = useSearchParams().get("student") ?? undefined

  const { t, table, typeLabels, statusLabels } = useRiskDict()
  const ti: NonNullable<RiskDict["interventions"]> = t.interventions ?? {}

  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 250)
    return () => clearTimeout(id)
  }, [search])

  // Stats are admin-only server-side; a teacher simply gets no stat row.
  useEffect(() => {
    getInterventionStats().then((r) => {
      if (r.success && r.data) setStats(r.data)
    })
  }, [])

  const load = useCallback(() => {
    startTransition(async () => {
      const r = await getAllInterventions({
        status: FILTER_STATUSES[filter],
        search: query || undefined,
        studentId,
        page,
        limit: PAGE_SIZE,
      })
      if (r.success && r.data) {
        setRows(r.data.interventions)
        setTotal(r.data.pagination.total)
        setPageCount(Math.max(1, r.data.pagination.totalPages))
      }
      setLoading(false)
    })
  }, [filter, query, studentId, page])

  useEffect(() => {
    load()
  }, [load])

  const count = (s: string[]) =>
    stats?.byStatus
      .filter((b) => s.includes(b.status))
      .reduce((a, b) => a + b.count, 0) ?? 0

  const figures = stats
    ? [
        {
          label: ti.active,
          value: formatCount(count(["SCHEDULED", "IN_PROGRESS"]), lang),
        },
        { label: ti.completed, value: formatCount(count(["COMPLETED"]), lang) },
        {
          label: ti.successRate,
          value:
            stats.successRate === null
              ? "—"
              : `${fmt1(stats.successRate, lang)}%`,
        },
        {
          label: ti.avgDays,
          value:
            stats.averageDaysToComplete === null
              ? "—"
              : (ti.daysValue ?? "{n}").replace(
                  "{n}",
                  fmt1(stats.averageDaysToComplete, lang)
                ),
        },
      ]
    : null

  const typeLabel = (ty: string) =>
    typeLabels[
      INTERVENTION_TYPE_KEYS[ty as keyof typeof INTERVENTION_TYPE_KEYS]
    ] ?? ty
  const filters = (["all", "active", "completed", "closed"] as Filter[]).map(
    (v) => ({ value: v, label: pick(ti.filters, v) ?? v })
  )

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="risk" />

      {figures ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="space-y-1">
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {studentId ? (
        <div className="bg-muted/60 flex items-center justify-between gap-3 rounded-full py-1.5 ps-4 pe-1.5 text-sm">
          <span>{ti.forStudent}</span>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => router.replace(pathname)}
          >
            <X className="size-3.5" />
            {ti.showAll}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onValueChange={(v) => {
            setFilter(v)
            setPage(1)
          }}
          options={filters}
          className="overflow-x-auto"
        />
        <div className="relative sm:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ti.search}
            className="rounded-full ps-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-1 rounded-2xl border px-6 py-16 text-center">
          <p className="font-medium">
            {query || filter !== "all" || studentId ? ti.noMatch : ti.empty}
          </p>
          {!query && filter === "all" && !studentId ? (
            <p className="text-muted-foreground text-sm">{ti.emptyHint}</p>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "bg-card overflow-hidden rounded-2xl border transition-opacity",
            isPending && "opacity-60"
          )}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4">{ti.columns?.student}</TableHead>
                  <TableHead>{ti.columns?.type}</TableHead>
                  <TableHead>{ti.columns?.status}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {ti.columns?.risk}
                  </TableHead>
                  <TableHead>{ti.columns?.date}</TableHead>
                  <TableHead className="hidden pe-4 lg:table-cell">
                    {ti.columns?.assignee}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const band = legacyBand(r.riskLevel)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="ps-4">
                        <p className="font-medium">
                          <bdi>{r.studentName}</bdi>
                        </p>
                        {r.className ? (
                          <p className="text-muted-foreground text-xs">
                            <bdi>{r.className}</bdi>
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{typeLabel(r.type)}</p>
                        {r.title && r.title !== typeLabel(r.type) ? (
                          <p className="text-muted-foreground max-w-[14rem] truncate text-xs">
                            <bdi>{r.title}</bdi>
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                            STATUS_TONE[r.status] ?? STATUS_TONE.CANCELLED
                          )}
                        >
                          {statusLabels[STATUS_KEYS[r.status]] ?? r.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              BAND_TONE[band].dot
                            )}
                          />
                          {pick(t.bands, band)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap tabular-nums">
                        {formatDay(r.scheduledDate ?? r.createdAt, lang)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden pe-4 text-sm lg:table-cell">
                        {r.assigneeName ?? ti.unassigned}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!loading && rows.length > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm tabular-nums">
            {pl(ti.total, total, lang)}
            {pageCount > 1 ? (
              <>
                {" · "}
                {(table.pageOf ?? "")
                  .replace("{page}", formatCount(page, lang))
                  .replace("{pages}", formatCount(pageCount, lang))}
              </>
            ) : null}
          </p>
          {pageCount > 1 ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page <= 1 || isPending}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                {table.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= pageCount || isPending}
                onClick={() => setPage((p) => p + 1)}
              >
                {table.next}
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
