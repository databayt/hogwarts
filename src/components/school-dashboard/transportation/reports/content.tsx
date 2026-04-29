// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { previewTransportFees } from "../actions/fees"
import {
  getDriverHours,
  getRouteUtilization,
  getTripStats,
} from "../actions/reports"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

function formatMinutes(total: number, locale: Locale) {
  const hrs = Math.floor(total / 60)
  const mins = total % 60
  if (locale === "ar") {
    return `${hrs} س ${mins} د`
  }
  return `${hrs}h ${mins}m`
}

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(value)
}

export async function TransportationReportsContent({
  locale,
  dictionary,
}: Props) {
  const t = dictionary.transportation
  const r = t.reports

  const [utilResult, hoursResult, statsResult, feesResult] = await Promise.all([
    getRouteUtilization(),
    getDriverHours(30),
    getTripStats(30),
    previewTransportFees(),
  ])

  if (
    !utilResult.success &&
    !hoursResult.success &&
    !statsResult.success &&
    !feesResult.success
  ) {
    return (
      <TransportationEmptyState
        title={r.empty}
        description={t.errors.internalError}
      />
    )
  }

  const utilization = utilResult.success ? utilResult.data : []
  const hours = hoursResult.success ? hoursResult.data : []
  const stats = statsResult.success ? statsResult.data : null
  const fees = feesResult.success ? feesResult.data : null

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">{r.title}</h2>
        <p className="text-muted-foreground text-sm">{r.subtitle}</p>
      </header>

      {/* Trip stats (last 30 days) */}
      {stats ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{r.tripStats.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Stat
                label={r.tripStats.scheduled}
                value={stats.totalScheduled}
              />
              <Stat
                label={r.tripStats.inProgress}
                value={stats.totalInProgress}
              />
              <Stat
                label={r.tripStats.completed}
                value={stats.totalCompleted}
              />
              <Stat
                label={r.tripStats.cancelled}
                value={stats.totalCancelled}
              />
              <Stat
                label={r.tripStats.completionRate}
                value={`${stats.completionRate}%`}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Route utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{r.utilization.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {utilization.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.empty.noRoutes}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {utilization.map((u) => (
                <li
                  key={u.routeId}
                  className="flex justify-between border-b py-1.5 last:border-b-0"
                >
                  <span>{u.routeName}</span>
                  <span className="text-muted-foreground">
                    {u.activeAssignments}
                    {u.capacity ? ` / ${u.capacity}` : ""}
                    {u.utilizationPct !== null ? ` (${u.utilizationPct}%)` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Driver hours (last 30 days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{r.driverHours.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {r.driverHours.empty}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {hours.map((h) => (
                <li
                  key={h.driverId}
                  className="flex justify-between border-b py-1.5 last:border-b-0"
                >
                  <span>
                    {h.firstName} {h.lastName}
                  </span>
                  <span className="text-muted-foreground">
                    {h.completedTrips} {r.driverHours.tripsLabel} ·{" "}
                    {formatMinutes(h.totalMinutes, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Fee preview (read-only) */}
      {fees ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{r.fees.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                label={r.fees.studentsWithFees}
                value={fees.studentsWithFees}
              />
              <Stat
                label={r.fees.studentsWithoutFee}
                value={fees.studentsWithoutFee}
              />
              <Stat
                label={r.fees.totalAssignments}
                value={fees.totalActiveAssignments}
              />
              <Stat
                label={r.fees.monthlyTotal}
                value={formatCurrency(fees.totalMonthlyRevenue, locale)}
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              {r.fees.notice}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
