// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getDriver } from "../actions/drivers"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  driverId: string
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

function fmt(value: Date | string | null | undefined, locale: Locale) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value)
}

export async function DriverDetailContent({
  driverId,
  locale,
  dictionary,
}: Props) {
  const result = await getDriver(driverId)
  const t = dictionary.transportation

  if (!result.success || !("data" in result)) {
    return (
      <TransportationEmptyState
        title={t.errors.notFound}
        action={
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/drivers`}>
              {t.nav.drivers}
            </Link>
          </Button>
        }
      />
    )
  }

  const d = result.data

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {d.firstName} {d.lastName}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t.drivers.statuses[d.status as keyof typeof t.drivers.statuses] ??
              d.status}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/transportation/drivers`}>
            {t.nav.drivers}
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.drivers.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.drivers.fields.phone} value={d.phone} />
            <Row label={t.drivers.fields.email} value={d.email ?? "—"} />
            <Row label={t.drivers.fields.address} value={d.address ?? "—"} />
            <Row
              label={t.drivers.fields.staffMember}
              value={
                d.staffMember
                  ? `${d.staffMember.firstName} ${d.staffMember.lastName}`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.drivers.fields.licenseNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={t.drivers.fields.licenseNumber}
              value={d.licenseNumber}
            />
            <Row
              label={t.drivers.fields.licenseClass}
              value={d.licenseClass ?? "—"}
            />
            <Row
              label={t.drivers.fields.licenseExpiry}
              value={fmt(d.licenseExpiry, locale)}
            />
            <Row
              label={t.drivers.fields.status}
              value={
                t.drivers.statuses[
                  d.status as keyof typeof t.drivers.statuses
                ] ?? d.status
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t.drivers.fields.emergencyContactName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row
            label={t.drivers.fields.emergencyContactName}
            value={d.emergencyContactName ?? "—"}
          />
          <Row
            label={t.drivers.fields.emergencyContactPhone}
            value={d.emergencyContactPhone ?? "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.nav.routes}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {d.routes.length === 0 ? (
            <p className="text-muted-foreground">{t.empty.noRoutes}</p>
          ) : (
            d.routes.map((route) => (
              <div
                key={route.id}
                className="flex justify-between border-b py-1.5 last:border-b-0"
              >
                <Link
                  href={`/${locale}/transportation/routes/${route.id}`}
                  className="hover:underline"
                >
                  {route.name}
                </Link>
                <span className="text-muted-foreground">
                  {route.code ?? "—"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {d.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.drivers.fields.notes}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {d.notes}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
