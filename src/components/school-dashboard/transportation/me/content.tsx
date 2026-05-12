// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getMyTransportationView } from "../actions/me"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
  isGuardian: boolean
}

export async function MyTransportationContent({
  locale,
  dictionary,
  isGuardian,
}: Props) {
  const t = dictionary.transportation
  const result = await getMyTransportationView()

  if (!result.success || result.data.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <header>
          <h2 className="text-2xl font-semibold">{t.me.title}</h2>
          <p className="text-muted-foreground text-sm">
            {isGuardian ? t.me.subtitleGuardian : t.me.subtitle}
          </p>
        </header>
        <TransportationEmptyState
          title={t.me.noAssignments}
          description={t.overview.noData}
        />
      </div>
    )
  }

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium" }
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">{t.me.title}</h2>
        <p className="text-muted-foreground text-sm">
          {isGuardian ? t.me.subtitleGuardian : t.me.subtitle}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {result.data.map((child) => (
          <Card key={child.studentId}>
            <CardHeader>
              <CardTitle className="text-base">
                {child.firstName} {child.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-medium">
                  {t.me.assignmentsHeading}
                </h3>
                {child.assignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t.me.noAssignments}
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {child.assignments.map((a) => (
                      <Card key={a.id} className="bg-muted/30">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {a.routeName}
                              {a.routeCode ? (
                                <span className="text-muted-foreground ms-2 text-xs">
                                  ({a.routeCode})
                                </span>
                              ) : null}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {directionLabel(a.direction, t.me)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            #{a.stopOrder} · {a.stopName}
                          </p>
                          {a.vehicle ? (
                            <p className="text-muted-foreground text-xs">
                              {t.me.vehicle}: {a.vehicle.plateNumber}
                            </p>
                          ) : null}
                          {a.driver ? (
                            <p className="text-muted-foreground text-xs">
                              {t.me.driver}: {a.driver.firstName}{" "}
                              {a.driver.lastName} · {a.driver.phone}
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-sm font-medium">
                  {t.me.recentTripsHeading}
                </h3>
                {child.recentTrips.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t.me.noRecentTrips}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.trips.fields.scheduledDate}</TableHead>
                        <TableHead>{t.trips.fields.scheduledTime}</TableHead>
                        <TableHead>{t.trips.fields.status}</TableHead>
                        <TableHead>{t.trips.fields.boardingStatus}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child.recentTrips.map((trip) => (
                        <TableRow key={trip.tripId}>
                          <TableCell>
                            {dateFormatter.format(trip.scheduledDate)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {trip.scheduledTime}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{trip.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {trip.boardingStatus ? (
                              <Badge variant="outline">
                                {trip.boardingStatus}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function directionLabel(
  dir: string,
  meDict: Dictionary["transportation"]["me"]
): string {
  switch (dir) {
    case "PICKUP":
      return meDict.directionPickup
    case "DROPOFF":
      return meDict.directionDropoff
    default:
      return meDict.directionRoundTrip
  }
}
