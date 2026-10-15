"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Students at risk — the one ranked list. Counts on the Segmented and the
 * rows come from the same `getRiskList` pass (see ./risk.ts for thresholds),
 * 25 per page. Row → student profile; "…" → interventions / letter.
 */
import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount } from "@/components/school-dashboard/school/configuration/ui/format"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { CreateInterventionDialog } from "../interventions/create-dialog"
import { AttendanceSectionNav } from "../ui/section-nav"
import { getRiskList, type RiskListResult, type RiskListRow } from "./actions"
import {
  BAND_TONE,
  formatRate,
  MIN_RECORDED_DAYS,
  RISK_WINDOW_DAYS,
  type AtRiskBand,
} from "./risk"
import { pick, pl, useRiskDict, type RiskDict } from "./use-risk-dict"

type Filter = AtRiskBand | "all"

export function EarlyWarningContent({ locale = "ar" }: { locale?: string }) {
  const lang = locale
  const router = useRouter()
  const { t, table } = useRiskDict()
  const tl: NonNullable<RiskDict["list"]> = t.list ?? {}
  const tb = t.bands

  const [band, setBand] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<RiskListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState<RiskListRow | null>(null)

  // Debounce typing into the query that hits the server
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 250)
    return () => clearTimeout(id)
  }, [search])

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getRiskList({ band, search: query, page })
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }, [band, query, page])

  useEffect(() => {
    load()
  }, [load])

  const counts = data?.counts
  const options = (["all", "critical", "high", "moderate"] as Filter[]).map(
    (v) => ({
      value: v,
      label: (
        <span className="flex items-center gap-1.5">
          {v !== "all" ? (
            <span
              className={cn("size-1.5 rounded-full", BAND_TONE[v].dot)}
              aria-hidden
            />
          ) : null}
          {pick(tb, v) ?? v}
          {counts ? (
            <span className="text-muted-foreground tabular-nums">
              {formatCount(counts[v], lang)}
            </span>
          ) : null}
        </span>
      ),
    })
  )

  const base = `/${lang}/attendance`

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="risk" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={band}
          onValueChange={(v) => {
            setBand(v)
            setPage(1)
          }}
          options={options}
          aria-label={tl.title}
          className="overflow-x-auto"
        />
        <div className="relative sm:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tl.search}
            className="rounded-full ps-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-card divide-y overflow-hidden rounded-2xl border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-2 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-1 rounded-2xl border px-6 py-16 text-center">
          <p className="font-medium">{query ? tl.noMatch : tl.empty}</p>
          {!query ? (
            <p className="text-muted-foreground max-w-sm text-sm">
              {tl.emptyHint}
            </p>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border transition-opacity",
            isPending && "opacity-60"
          )}
        >
          {data.rows.map((row) => (
            <RiskRow
              key={row.studentId}
              row={row}
              lang={lang}
              t={t}
              onOpen={() => router.push(`/${lang}/students/${row.studentId}`)}
              onCreate={() => setCreating(row)}
              interventionsHref={`${base}/interventions?student=${row.studentId}`}
              letterHref={`${base}/letters?student=${row.studentId}&band=${row.band}`}
            />
          ))}
        </div>
      )}

      {data && data.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm tabular-nums">
            {(table.pageOf ?? "Page {page} of {pages}")
              .replace("{page}", formatCount(data.page, lang))
              .replace("{pages}", formatCount(data.pageCount, lang))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={data.page <= 1 || isPending}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
              {table.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={data.page >= data.pageCount || isPending}
              onClick={() => setPage((p) => p + 1)}
            >
              {table.next}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="text-muted-foreground space-y-1 px-1 text-xs leading-relaxed">
        <p>
          {(tl.footnote ?? "")
            .replace("{days}", formatCount(RISK_WINDOW_DAYS, lang))
            .replace("{min}", formatCount(MIN_RECORDED_DAYS, lang))}
        </p>
        {data && data.insufficient > 0 ? (
          <p>{pl(tl.insufficient, data.insufficient, lang)}</p>
        ) : null}
      </div>

      <CreateInterventionDialog
        student={
          creating
            ? {
                id: creating.studentId,
                name: creating.name,
                band: creating.band,
              }
            : null
        }
        onOpenChange={(open) => !open && setCreating(null)}
        onCreated={() => {
          setCreating(null)
          load()
        }}
      />
    </div>
  )
}

function RiskRow({
  row,
  lang,
  t,
  onOpen,
  onCreate,
  interventionsHref,
  letterHref,
}: {
  row: RiskListRow
  lang: string
  t: RiskDict
  onOpen: () => void
  onCreate: () => void
  interventionsHref: string
  letterHref: string
}) {
  const tl: NonNullable<RiskDict["list"]> = t.list ?? {}
  const tone = BAND_TONE[row.band]
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen()
      }}
      className="hover:bg-muted/40 focus-visible:bg-muted/40 flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <bdi>{row.name}</bdi>
        </p>
        <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          {row.sectionName ? <bdi>{row.sectionName}</bdi> : null}
          {row.sectionName ? <span aria-hidden>·</span> : null}
          <span>{pl(tl.absences, row.absentDays, lang)}</span>
          {row.consecutiveAbsences > 1 ? (
            <>
              <span aria-hidden>·</span>
              <span className="text-red-600 dark:text-red-400">
                {pl(tl.streak, row.consecutiveAbsences, lang)}
              </span>
            </>
          ) : null}
          {row.hasActiveIntervention ? (
            <>
              <span aria-hidden>·</span>
              <span>{tl.activeIntervention}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="hidden w-36 items-center gap-2 sm:flex">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full", tone.dot)}
            style={{ width: `${Math.max(2, Math.min(100, row.rate))}%` }}
          />
        </div>
        <span className="w-12 text-end text-sm font-medium tabular-nums">
          {formatRate(row.rate, lang)}
        </span>
        {row.trend !== "stable" ? (
          <span title={pick(tl.trend, row.trend)}>
            {row.trend === "improving" ? (
              <TrendingUp className="size-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="size-3.5 text-red-600" />
            )}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
      </div>
      <span className="text-sm font-medium tabular-nums sm:hidden">
        {formatRate(row.rate, lang)}
      </span>

      <span
        className={cn(
          "hidden rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap md:inline-flex",
          tone.badge
        )}
        title={pick(t.tierNames, row.tier)}
      >
        {pick(t.tiers, row.tier) ?? row.tier}
        <span className="mx-1 opacity-50">·</span>
        {pick(t.bands, row.band)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            aria-label={tl.actions}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onOpen}>
            {tl.openProfile}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={interventionsHref}>{tl.openInterventions}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCreate}>
            {tl.createIntervention}
          </DropdownMenuItem>
          {row.band !== "moderate" ? (
            <DropdownMenuItem asChild>
              <Link href={letterHref}>{tl.generateLetter}</Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
