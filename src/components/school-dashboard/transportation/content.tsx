// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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

  const tiles = [
    { label: overview.totalVehicles, value: stats.totalVehicles },
    { label: overview.totalRoutes, value: stats.totalRoutes },
    { label: overview.totalDrivers, value: stats.totalDrivers },
    { label: overview.activeAssignments, value: stats.activeAssignments },
  ]

  const totalExpiring =
    (expiring?.drivers.length ?? 0) + (expiring?.vehicles.length ?? 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t.title}</h2>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/vehicles`}>
              {t.nav.vehicles}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/routes`}>
              {t.nav.routes}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/trips`}>{t.nav.trips}</Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/transportation/reports`}>
              {t.nav.reports}
            </Link>
          </Button>
        </div>
      </header>

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
                      {a.route?.name}
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
