// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import Link from "next/link"
import { ArrowLeft, CalendarCheck2, Network, TrendingUp } from "lucide-react"

import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { requireOperator } from "@/components/saas-dashboard/lib/operator-auth"

const PLATFORM_SCHOOL_ID = "platform"

// Weekly targets per content/docs-en/sales.mdx — keep as a module-local const
// so docs and code stay aligned. If the doc changes, update here too.
const WEEKLY_TARGETS = {
  newWarmProspects: 3,
  outreachActions: 10,
  discoveryCalls: 2,
  proposalsMonthly: 1,
  pilotsSignedMonthly: 2,
} as const

// MENA-10 milestone target — 10 free pilots signed (sales.mdx Status snapshot).
const MENA10_PILOTS_TARGET = 10

interface Props {
  dictionary?: Dictionary["sales"]
  lang: Locale
}

function startOfWeek(now: Date): Date {
  const d = new Date(now)
  const day = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function AnalyticsContent({ dictionary, lang }: Props) {
  await requireOperator()

  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const where = { schoolId: PLATFORM_SCHOOL_ID }

  // Run the aggregations in parallel — none depend on each other and the page
  // is force-dynamic anyway.
  const [
    totalLeads,
    newThisWeekNetwork,
    tierACount,
    tierBCount,
    tierCCount,
    statusGroup,
    activityThisWeek,
    proposalsMonth,
    pilotsSignedMonth,
    closedWonTotal,
  ] = await Promise.all([
    db.lead.count({ where }),
    // "New warm prospects" target counts net-new leads in the network this
    // week. We use the `network` tag to define "warm" same as the seed.
    db.lead.count({
      where: {
        ...where,
        createdAt: { gte: weekStart },
        tags: { hasSome: ["network"] },
      },
    }),
    db.lead.count({ where: { ...where, tags: { hasSome: ["tier-a"] } } }),
    db.lead.count({ where: { ...where, tags: { hasSome: ["tier-b"] } } }),
    db.lead.count({ where: { ...where, tags: { hasSome: ["tier-c"] } } }),
    db.lead.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    // Outreach + discovery come from LeadActivity rows. We use `type` to bucket
    // (email_sent, call, meeting). "Outreach actions" = email + call;
    // "discovery calls" = meeting per the sales.mdx convention.
    db.leadActivity.groupBy({
      by: ["type"],
      where: { schoolId: PLATFORM_SCHOOL_ID, createdAt: { gte: weekStart } },
      _count: { _all: true },
    }),
    // Proposals + pilots are status transitions — count distinct leads that
    // hit each terminal status this month. Cheap because Lead.updatedAt is
    // indexed via the @@index([schoolId]) compound on writes.
    db.lead.count({
      where: { ...where, status: "PROPOSAL", updatedAt: { gte: monthStart } },
    }),
    db.lead.count({
      where: { ...where, status: "CLOSED_WON", updatedAt: { gte: monthStart } },
    }),
    db.lead.count({ where: { ...where, status: "CLOSED_WON" } }),
  ])

  const outreachThisWeek = activityThisWeek
    .filter((row) => row.type === "email_sent" || row.type === "call")
    .reduce((sum, row) => sum + row._count._all, 0)
  const discoveryThisWeek = activityThisWeek
    .filter((row) => row.type === "meeting")
    .reduce((sum, row) => sum + row._count._all, 0)

  const a = dictionary?.analytics
  const t = {
    back: dictionary?.detail?.back ?? "Back to leads",
    title: a?.totalLeads ? "Sales Analytics" : "Sales Analytics",
    totalLeads: a?.totalLeads ?? "Total leads",
    allTimeTotal: a?.allTimeTotal ?? "All time total",
    statusDistribution: a?.statusDistribution ?? "Status distribution",
    leadsByStatus: a?.leadsByStatus ?? "Leads by status",
    weeklyCadence: "Weekly cadence",
    weeklySubtitle: "Targets from sales.mdx — Monday resets the counters.",
    tierFunnel: "Network funnel",
    tierFunnelSubtitle: "Tier A → Tier B → Tier C across the warm pipeline.",
    mena10: "MENA-10 pilots",
    mena10Subtitle: "Free 6-month pilots signed against the 10-school target.",
    metricNewWarm: "New warm prospects",
    metricOutreach: "Outreach actions",
    metricDiscovery: "Discovery calls",
    metricProposals: "Proposals sent (month)",
    metricPilots: "Pilots signed (month)",
    targetWeek: "this week",
    targetMonth: "this month",
  }

  const tier = [
    { label: dictionary?.tier?.A ?? "A", count: tierACount },
    { label: dictionary?.tier?.B ?? "B", count: tierBCount },
    { label: dictionary?.tier?.C ?? "C", count: tierCCount },
  ]
  const tierTotal = Math.max(
    1,
    tier.reduce((s, t) => s + t.count, 0)
  )

  const statusRows = statusGroup
    .map((row) => ({
      key: row.status,
      label: dictionary?.status?.[row.status] ?? row.status,
      count: row._count._all,
    }))
    .sort((x, y) => y.count - x.count)
  const statusTotal = Math.max(
    1,
    statusRows.reduce((s, r) => s + r.count, 0)
  )

  const cadenceRows: Array<{
    label: string
    actual: number
    target: number
    suffix: string
  }> = [
    {
      label: t.metricNewWarm,
      actual: newThisWeekNetwork,
      target: WEEKLY_TARGETS.newWarmProspects,
      suffix: t.targetWeek,
    },
    {
      label: t.metricOutreach,
      actual: outreachThisWeek,
      target: WEEKLY_TARGETS.outreachActions,
      suffix: t.targetWeek,
    },
    {
      label: t.metricDiscovery,
      actual: discoveryThisWeek,
      target: WEEKLY_TARGETS.discoveryCalls,
      suffix: t.targetWeek,
    },
    {
      label: t.metricProposals,
      actual: proposalsMonth,
      target: WEEKLY_TARGETS.proposalsMonthly,
      suffix: t.targetMonth,
    },
    {
      label: t.metricPilots,
      actual: pilotsSignedMonth,
      target: WEEKLY_TARGETS.pilotsSignedMonthly,
      suffix: t.targetMonth,
    },
  ]

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={`/${lang}/sales`}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t.back}
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t.totalLeads}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {totalLeads}
            </div>
            <p className="text-muted-foreground text-xs">{t.allTimeTotal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t.mena10}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-semibold tabular-nums">
              {closedWonTotal}{" "}
              <span className="text-muted-foreground text-base font-normal">
                / {MENA10_PILOTS_TARGET}
              </span>
            </div>
            <Progress
              value={(closedWonTotal / MENA10_PILOTS_TARGET) * 100}
              aria-label={`${closedWonTotal} of ${MENA10_PILOTS_TARGET}`}
            />
            <p className="text-muted-foreground text-xs">{t.mena10Subtitle}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Network className="h-4 w-4" />
                {t.tierFunnel}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-muted-foreground text-xs">
              {t.tierFunnelSubtitle}
            </div>
            {tier.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {dictionary?.tier?.[row.label as "A" | "B" | "C"] ??
                      row.label}
                  </span>
                  <span className="tabular-nums">{row.count}</span>
                </div>
                <Progress value={(row.count / tierTotal) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck2 className="h-4 w-4" />
              {t.weeklyCadence}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t.weeklySubtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {cadenceRows.map((row) => {
              const pct = row.target ? (row.actual / row.target) * 100 : 0
              const hit = row.actual >= row.target
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{row.label}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        hit ? "text-emerald-600 dark:text-emerald-400" : ""
                      )}
                    >
                      {row.actual} / {row.target}{" "}
                      <span className="text-muted-foreground text-xs">
                        {row.suffix}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, pct)}
                    aria-label={`${row.actual} of ${row.target}`}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              {t.statusDistribution}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t.leadsByStatus}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {dictionary?.noLeads ?? "No leads"}
              </p>
            ) : (
              statusRows.map((row) => (
                <div key={row.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="tabular-nums">{row.count}</span>
                  </div>
                  <Progress value={(row.count / statusTotal) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
