// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getVehicle } from "../actions/vehicles"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  vehicleId: string
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

export async function VehicleDetailContent({
  vehicleId,
  locale,
  dictionary,
}: Props) {
  const result = await getVehicle(vehicleId)
  const t = dictionary.transportation

  if (!result.success || !("data" in result)) {
    return (
      <TransportationEmptyState
        title={t.errors.notFound}
        action={
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/vehicles`}>
              {t.nav.vehicles}
            </Link>
          </Button>
        }
      />
    )
  }

  const v = result.data

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{v.plateNumber}</h2>
          <p className="text-muted-foreground text-sm">
            {t.vehicles.types[v.vehicleType as keyof typeof t.vehicles.types] ??
              v.vehicleType}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/transportation/vehicles`}>
            {t.nav.vehicles}
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.vehicles.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.vehicles.fields.make} value={v.make ?? "—"} />
            <Row label={t.vehicles.fields.model} value={v.model ?? "—"} />
            <Row
              label={t.vehicles.fields.year}
              value={v.year ? String(v.year) : "—"}
            />
            <Row
              label={t.vehicles.fields.capacity}
              value={String(v.capacity)}
            />
            <Row
              label={t.vehicles.fields.status}
              value={
                t.vehicles.statuses[
                  v.status as keyof typeof t.vehicles.statuses
                ] ?? v.status
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.overview.expiringDocuments}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={t.vehicles.fields.registrationExpiry}
              value={fmt(v.registrationExpiry, locale)}
            />
            <Row
              label={t.vehicles.fields.insuranceExpiry}
              value={fmt(v.insuranceExpiry, locale)}
            />
            <Row
              label={t.vehicles.fields.lastInspection}
              value={fmt(v.lastInspection, locale)}
            />
          </CardContent>
        </Card>
      </div>

      {v.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.vehicles.fields.notes}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {v.notes}
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
