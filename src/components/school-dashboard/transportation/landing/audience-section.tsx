// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowRight, Bus, ShieldCheck, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { LandingSectionProps } from "./types"

// The three people transportation actually serves — the shape every school
// transport product converges on (BusRight splits its homepage the same way:
// transportation teams / parents / drivers). Each card lands on the surface
// that audience already has in this block.
const AUDIENCES = [
  {
    key: "admins",
    Icon: ShieldCheck,
    title: "Transport office",
    description:
      "Plan the fleet, assign students to stops, and watch every run from one board.",
    cta: "Open the dashboard",
  },
  {
    key: "families",
    Icon: Users,
    title: "Families",
    description:
      "Guardians see their child's route, follow the bus live, and flag a day off pickup.",
    cta: "My transportation",
  },
  {
    key: "drivers",
    Icon: Bus,
    title: "Drivers and staff",
    description:
      "Start the run, work the stop list in order, and mark each student on and off.",
    cta: "Today's trips",
  },
] as const

type AudienceKey = (typeof AUDIENCES)[number]["key"]

interface Props extends LandingSectionProps {
  /**
   * Where each card links. `null` renders the card without a link — a tab the
   * viewer's role can't open would only bounce them back to /dashboard.
   */
  hrefs: Record<AudienceKey, string | null>
}

export function AudienceSection({ dictionary, hrefs }: Props) {
  const t = dictionary?.landing?.audience

  return (
    <section>
      <div className="mb-12 text-center md:mb-16">
        <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">
          {t?.title || "Built for everyone on the route"}
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {t?.description ||
            "The office plans it, the driver runs it, the family follows it — the same trip, three views."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {AUDIENCES.map((audience, index) => {
          const Icon = audience.Icon
          const item = t?.items?.[index]
          const href = hrefs[audience.key]

          return (
            <Card
              key={audience.key}
              className="hover:border-foreground flex flex-col border shadow-none transition-colors"
            >
              <CardHeader>
                <div className="text-foreground mb-4 flex h-12 w-12 items-end">
                  <Icon className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                </div>
                <CardTitle className="text-start">
                  {item?.title || audience.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                <p className="text-muted-foreground text-start">
                  {item?.description || audience.description}
                </p>
                {href ? (
                  <Link
                    href={href}
                    className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold"
                  >
                    {item?.cta || audience.cta}
                    <ArrowRight
                      className="h-4 w-4 rtl:[transform:scaleX(-1)]"
                      aria-hidden
                    />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
