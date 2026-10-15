// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Support tiers (MTSS). Same students and thresholds as the at-risk list —
 * Tier 1 watch / Tier 2 targeted / Tier 3 intensive — so the three counts
 * add up to "All at risk" there. Tap a student to start a tiered action.
 */
"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { displayName } from "@/lib/name-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useNameDisplay } from "@/components/school-dashboard/context/use-name-display"
import { formatCount } from "@/components/school-dashboard/school/configuration/ui/format"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { BAND_TONE, formatRate, tierBand } from "../../early-warning/risk"
import {
  pick,
  useRiskDict,
  type RiskDict,
} from "../../early-warning/use-risk-dict"
import { AttendanceSectionNav } from "../../ui/section-nav"
import {
  createTieredIntervention,
  getMTSSStats,
  getStudentsByTier,
} from "./actions"
import { getRecommendedActions, type TierLevel } from "./validation"

interface Student {
  id: string
  firstName: string
  middleName?: string | null
  lastName: string
  sectionName: string | null
  rate: number
  totalDays: number
  absentDays: number
  tier: TierLevel
  hasActiveIntervention: boolean
}

interface Stats {
  pending: number
  completedThisMonth: number
  escalatedThisMonth: number
  overdue: number
}

const TIERS: TierLevel[] = ["TIER_3", "TIER_2", "TIER_1"]
const STEP = 25

export function MTSSContent({ locale }: { locale: string }) {
  const lang = locale
  const nameDisplay = useNameDisplay()
  const { t } = useRiskDict()
  const tp: NonNullable<RiskDict["tiersPage"]> = t.tiersPage ?? {}

  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<TierLevel>("TIER_3")
  const [data, setData] = useState<Record<TierLevel, Student[]>>({
    TIER_1: [],
    TIER_2: [],
    TIER_3: [],
  })
  const [stats, setStats] = useState<Stats | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [shown, setShown] = useState(STEP)
  const [isPending, startTransition] = useTransition()

  const [, startLoading] = useTransition()
  const load = useCallback(
    () =>
      startLoading(async () => {
        const [tierResult, statsResult] = await Promise.all([
          getStudentsByTier(),
          getMTSSStats(),
        ])
        if (tierResult.success && tierResult.data) {
          const d = tierResult.data as Record<string, { students: Student[] }>
          setData({
            TIER_1: d.tier1.students,
            TIER_2: d.tier2.students,
            TIER_3: d.tier3.students,
          })
        }
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as Stats)
        }
        setLoading(false)
      }),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  const act = (student: Student, action: string) =>
    startTransition(async () => {
      const label = pick(tp.actions, action) ?? action
      const result = await createTieredIntervention({
        studentId: student.id,
        tier: student.tier,
        action,
        title: `${label} · ${displayName(student, nameDisplay)}`,
        priority:
          student.tier === "TIER_3" ? 4 : student.tier === "TIER_2" ? 3 : 2,
        parentNotify: student.tier !== "TIER_1",
      })
      if (result.success) {
        toast.success(t.create?.done)
        setOpen(null)
        load()
      } else {
        toast.error(t.create?.failed)
      }
    })

  const figures = stats
    ? [
        { label: tp.pending, value: stats.pending },
        { label: tp.completedThisMonth, value: stats.completedThisMonth },
        { label: tp.escalations, value: stats.escalatedThisMonth },
        { label: tp.overdue, value: stats.overdue, alert: stats.overdue > 0 },
      ]
    : null

  const list = data[tier]

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="risk" />

      {figures ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="space-y-1">
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd
                className={cn(
                  "text-2xl font-semibold tracking-tight tabular-nums",
                  f.alert && "text-red-600 dark:text-red-400"
                )}
              >
                {formatCount(f.value, lang)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="space-y-2">
        <Segmented
          value={tier}
          onValueChange={(v) => {
            setTier(v)
            setOpen(null)
            setShown(STEP)
          }}
          options={TIERS.map((v) => ({
            value: v,
            label: (
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    BAND_TONE[tierBand(v)].dot
                  )}
                  aria-hidden
                />
                {t.tiers?.[v]} · {t.tierNames?.[v]}
                {!loading ? (
                  <span className="text-muted-foreground tabular-nums">
                    {formatCount(data[v].length, lang)}
                  </span>
                ) : null}
              </span>
            ),
          }))}
          className="overflow-x-auto"
        />
        <p className="text-muted-foreground px-1 text-xs">
          {t.tierHints?.[tier]}
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-card rounded-2xl border px-6 py-16 text-center font-medium">
          {tp.empty}
        </div>
      ) : (
        <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          {list.slice(0, shown).map((s) => (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => setOpen(open === s.id ? null : s.id)}
                aria-expanded={open === s.id}
                className="hover:bg-muted/40 flex w-full items-center gap-4 px-4 py-3 text-start transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <bdi>{displayName(s, nameDisplay)}</bdi>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {s.sectionName ? (
                      <>
                        <bdi>{s.sectionName}</bdi> ·{" "}
                      </>
                    ) : null}
                    {(tp.days ?? "")
                      .replace("{absent}", formatCount(s.absentDays, lang))
                      .replace("{total}", formatCount(s.totalDays, lang))}
                    {s.hasActiveIntervention ? ` · ${tp.active}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatRate(s.rate, lang)}
                </span>
              </button>
              {open === s.id ? (
                <div className="bg-muted/30 px-4 pt-1 pb-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    {tp.pickAction}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getRecommendedActions(s.tier).map((action) => (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={isPending}
                        onClick={() => act(s, action)}
                      >
                        {pick(tp.actions, action) ?? action}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {list.length > shown ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setShown((n) => n + STEP)}
          >
            {tp.showMore}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
