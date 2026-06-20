// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLabels, getName } from "@/components/translation/person"

import { getTrip } from "../actions/trips"
import { TransportationEmptyState } from "../empty-state"
import type { PlanStop } from "../lib/plan"
import { decodePolyline } from "../lib/polyline"
import { DriverTracker } from "./driver-tracker"
import { TripBoardingControls } from "./trip-boarding-controls"
import { TripLiveMap } from "./trip-live-map"
import { RegenerateTripPlanButton } from "./trip-plan-actions"

interface Props {
  tripId: string
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

function fmtDate(value: Date | string | null | undefined, locale: Locale) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value)
}

export async function TripDetailContent({ tripId, locale, dictionary }: Props) {
  const result = await getTrip(tripId)
  const t = dictionary.transportation

  if (!result.success || !("data" in result)) {
    return (
      <TransportationEmptyState
        title={t.errors.notFound}
        action={
          <Button asChild variant="outline">
            <Link href={`/${locale}/transportation/trips`}>{t.nav.trips}</Link>
          </Button>
        }
      />
    )
  }

  const trip = result.data
  const { schoolId } = await getTenantContext()
  // Driver name (transliterated) + route place-name (translated) resolve in the
  // viewer's locale; both fall back to source on miss.
  const [driverName, routeLabels] = await Promise.all([
    trip.driver
      ? getName(trip.driver, locale, schoolId!)
      : Promise.resolve("—"),
    trip.route?.name
      ? getLabels([trip.route.name], locale, schoolId!)
      : Promise.resolve(new Map<string, string>()),
  ])
  const routeName = trip.route?.name
    ? (routeLabels.get(trip.route.name) ?? trip.route.name)
    : "—"

  // Optimized plan (Phase 2) — ordered stops + ETAs, frozen on the trip.
  const planStops: PlanStop[] = Array.isArray(trip.optimizedStopOrder)
    ? (trip.optimizedStopOrder as unknown as PlanStop[])
    : []
  const stopNameLabels =
    trip.route?.stops && trip.route.stops.length > 0
      ? await getLabels(
          trip.route.stops.map((s) => s.name),
          locale,
          schoolId!
        )
      : new Map<string, string>()
  const stopNameById = new Map(
    (trip.route?.stops ?? []).map((s) => [
      s.id,
      stopNameLabels.get(s.name) ?? s.name,
    ])
  )

  // Live-tracking inputs (only meaningful while the trip is in progress).
  const isLive = trip.status === "IN_PROGRESS"
  const mapStops = (trip.route?.stops ?? [])
    .filter((s) => s.latitude != null && s.longitude != null)
    .map((s) => ({
      id: s.id,
      name: stopNameById.get(s.id) ?? s.name,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
    }))
  const routePath = trip.polylineEncoded
    ? decodePolyline(trip.polylineEncoded)
    : undefined

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {routeName} ·{" "}
            {t.routes.directions[
              trip.direction as keyof typeof t.routes.directions
            ] ?? trip.direction}
          </h2>
          <p className="text-muted-foreground text-sm">
            {fmtDate(trip.scheduledDate, locale)} · {trip.scheduledTime}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/transportation/trips`}>{t.nav.trips}</Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.trips.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label={t.trips.fields.status}
              value={
                t.trips.statuses[
                  trip.status as keyof typeof t.trips.statuses
                ] ?? trip.status
              }
            />
            <Row
              label={t.trips.fields.actualStart}
              value={fmtDate(trip.actualStartTime, locale)}
            />
            <Row
              label={t.trips.fields.actualEnd}
              value={fmtDate(trip.actualEndTime, locale)}
            />
            <Row
              label={t.trips.fields.vehicle}
              value={trip.vehicle?.plateNumber ?? "—"}
            />
            <Row label={t.trips.fields.driver} value={driverName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.trips.fields.boardings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TripBoardingControls
              tripId={trip.id}
              status={
                trip.status as
                  | "SCHEDULED"
                  | "IN_PROGRESS"
                  | "COMPLETED"
                  | "CANCELLED"
              }
              dictionary={dictionary}
            />
            {trip.boardings.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t.empty.noAssignments}
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {trip.boardings.map((b) => (
                  <li
                    key={b.id}
                    className="flex justify-between border-b py-1.5 last:border-b-0"
                  >
                    <span>
                      #{b.stop?.stopOrder} {b.student?.firstName}{" "}
                      {b.student?.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {t.trips.boardingStatuses[
                        b.status as keyof typeof t.trips.boardingStatuses
                      ] ?? b.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t.optimize.planTitle}</CardTitle>
          <RegenerateTripPlanButton tripId={trip.id} dictionary={dictionary} />
        </CardHeader>
        <CardContent>
          {planStops.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.optimize.noPlan}</p>
          ) : (
            <>
              {trip.planSource ? (
                <p className="text-muted-foreground mb-2 text-xs">
                  {t.optimize.source[
                    trip.planSource as keyof typeof t.optimize.source
                  ] ?? trip.planSource}
                </p>
              ) : null}
              <ol className="space-y-1 text-sm">
                {planStops.map((p, i) => (
                  <li
                    key={p.stopId}
                    className="flex justify-between border-b py-1.5 last:border-b-0"
                  >
                    <span>
                      {i + 1}. {stopNameById.get(p.stopId) ?? p.stopId}
                    </span>
                    <span className="text-muted-foreground">
                      {p.eta ? `${t.optimize.eta} ${p.eta}` : ""}
                      {p.distanceFromPrevKm
                        ? `  ·  ${p.distanceFromPrevKm} km`
                        : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </CardContent>
      </Card>

      {isLive ? (
        <>
          <DriverTracker tripId={trip.id} dictionary={dictionary} />
          <TripLiveMap
            tripId={trip.id}
            stops={mapStops}
            routePath={routePath}
            dictionary={dictionary}
          />
        </>
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
