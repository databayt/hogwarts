// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getName } from "@/components/translation/person"

import { getRoute } from "../actions/routes"
import { TransportationEmptyState } from "../empty-state"
import { StopEditor } from "./stop-editor"

interface Props {
  routeId: string
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function RouteDetailContent({
  routeId,
  locale,
  dictionary,
}: Props) {
  const result = await getRoute(routeId)
  const t = dictionary.transportation

  if (!result.success || !("data" in result)) {
    return (
      <TransportationEmptyState
        title={t.errors.notFound}
        action={
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/routes`}>
              {t.nav.routes}
            </Link>
          </Button>
        }
      />
    )
  }

  const route = result.data
  const { schoolId } = await getTenantContext()
  const driverName = route.driver
    ? await getName(route.driver, locale, schoolId!)
    : "—"

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{route.name}</h2>
          <p className="text-muted-foreground text-sm">
            {route.originName} → {route.destinationName}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/transportation/routes`}>{t.nav.routes}</Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.routes.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t.routes.fields.code} value={route.code ?? "—"} />
            <Row
              label={t.routes.fields.direction}
              value={
                t.routes.directions[
                  route.direction as keyof typeof t.routes.directions
                ] ?? route.direction
              }
            />
            <Row
              label={t.routes.fields.departureTime}
              value={route.departureTime}
            />
            <Row
              label={t.routes.fields.returnTime}
              value={route.returnTime ?? "—"}
            />
            <Row
              label={t.routes.fields.monthlyFee}
              value={route.monthlyFee?.toString() ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.routes.fields.vehicle} / {t.routes.fields.driver}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={t.routes.fields.vehicle}
              value={route.vehicle?.plateNumber ?? "—"}
            />
            <Row label={t.routes.fields.driver} value={driverName} />
            <Row
              label={t.assignments.title}
              value={String(route._count.assignments)}
            />
          </CardContent>
        </Card>
      </div>

      <StopEditor
        routeId={route.id}
        initialStops={route.stops}
        dictionary={dictionary}
      />
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
