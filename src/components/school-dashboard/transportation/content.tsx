// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import {
  getExpiringDocuments,
  getOverviewStats,
  getRecentAssignments,
} from "./actions/overview"
import { TransportationEmptyState } from "./empty-state"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

function formatDate(value: Date | string | null, locale: Locale) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value)
}

export async function TransportationOverviewContent({
  locale,
  dictionary,
}: Props) {
  const [statsResult, expiringResult, recentResult] = await Promise.all([
    getOverviewStats(),
    getExpiringDocuments(),
    getRecentAssignments(5),
  ])

  const t = dictionary.transportation
  const overview = t.overview

  if (!statsResult.success) {
    return (
      <TransportationEmptyState
        title={overview.noData}
        description={t.errors.internalError}
      />
    )
  }

  const stats = statsResult.data
  const expiring = expiringResult.success ? expiringResult.data : null
  const recent = recentResult.success ? recentResult.data : []

  // Localize route place-names in the recent-assignments widget (ONE batched
  // resolution; source fallback on miss).
  const { schoolId } = await getTenantContext()
  const routeLabels =
    recent.length > 0 && schoolId
      ? await getLabels(
          recent.map((a) => a.route?.name),
          locale,
          schoolId
        )
      : new Map<string, string>()

  const tiles = [
    { label: overview.totalVehicles, value: stats.totalVehicles },
    { label: overview.totalRoutes, value: stats.totalRoutes },
    { label: overview.totalDrivers, value: stats.totalDrivers },
    { label: overview.activeAssignments, value: stats.activeAssignments },
  ]

  const totalExpiring =
    (expiring?.drivers.length ?? 0) + (expiring?.vehicles.length ?? 0)

  return (
    <div className="flex flex-col gap-6">
      {/*
        No heading row and no nav buttons: since this page moved under the
        `(app)` route group it sits below the shared tab strip, which already
        names the section (PageHeadingSetter) and links every sibling surface.
        Repeating them here read as two navs stacked on one screen.
      */}
      <p className="text-muted-foreground text-sm">{t.subtitle}</p>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {tile.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {overview.expiringDocuments}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {totalExpiring === 0 ? (
              <p className="text-muted-foreground text-sm">{overview.noData}</p>
            ) : (
              <ul className="text-sm">
                {expiring?.drivers.map((d) => (
                  <li
                    key={d.id}
                    className="flex justify-between border-b py-1.5 last:border-b-0"
                  >
                    <span>
                      {d.firstName} {d.lastName} ·{" "}
                      {t.drivers.licenseExpiringSoon}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(d.licenseExpiry, locale)}
                    </span>
                  </li>
                ))}
                {expiring?.vehicles.map((v) => (
                  <li
                    key={v.id}
                    className="flex justify-between border-b py-1.5 last:border-b-0"
                  >
                    <span>{v.plateNumber}</span>
                    <span className="text-muted-foreground">
                      {formatDate(
                        v.insuranceExpiry ?? v.registrationExpiry,
                        locale
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {overview.recentAssignments}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t.empty.noAssignments}
              </p>
            ) : (
              <ul className="text-sm">
                {recent.map((a) => (
                  <li
                    key={a.id}
                    className="flex justify-between border-b py-1.5 last:border-b-0"
                  >
                    <span>
                      {a.student?.firstName} {a.student?.lastName} →{" "}
                      {a.route?.name
                        ? (routeLabels.get(a.route.name) ?? a.route.name)
                        : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(a.createdAt, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
