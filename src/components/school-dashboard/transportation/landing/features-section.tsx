// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ClipboardCheck, MapPin, Navigation, Truck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { LandingSectionProps } from "./types"

// Each card maps to a real surface of this block — vehicles/drivers, routes +
// stops, the live trip map, and TripBoarding. Icons are lucide (bundled), the
// same choice lumos/home/curriculum-section.tsx made: no external hotlinks in
// a grid that has to stay crisp at every breakpoint.
const FEATURES = [
  {
    Icon: Truck,
    title: "Fleet and drivers",
    description:
      "Vehicles, capacities, licences and expiry dates — one record per bus and per driver.",
  },
  {
    Icon: MapPin,
    title: "Routes and stops",
    description:
      "Draw a route, order its stops on a map, and let the optimizer sequence them for you.",
  },
  {
    Icon: Navigation,
    title: "Live tracking",
    description:
      "Follow a running trip on the map and alert guardians as the bus approaches their stop.",
  },
  {
    Icon: ClipboardCheck,
    title: "Boarding records",
    description:
      "Every student marked boarded, alighted or missed — a full history behind each trip.",
  },
]

export function FeaturesSection({ dictionary }: LandingSectionProps) {
  const items = dictionary?.landing?.features

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature, index) => {
        const Icon = feature.Icon
        const item = items?.[index]
        return (
          <Card
            key={feature.title}
            className="hover:border-foreground border shadow-none transition-colors"
          >
            <CardHeader>
              <div className="text-foreground mb-4 flex h-12 w-12 items-end">
                <Icon className="h-10 w-10" strokeWidth={1.5} aria-hidden />
              </div>
              <CardTitle className="text-start">
                {item?.title || feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-start">
                {item?.description || feature.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
