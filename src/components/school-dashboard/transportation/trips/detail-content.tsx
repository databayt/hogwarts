// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getTrip } from "../actions/trips"
import { TransportationEmptyState } from "../empty-state"
import { TripBoardingControls } from "./trip-boarding-controls"

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {trip.route?.name ?? "—"} ·{" "}
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
            <Row
              label={t.trips.fields.driver}
              value={
                trip.driver
                  ? `${trip.driver.firstName} ${trip.driver.lastName}`
                  : "—"
              }
            />
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
