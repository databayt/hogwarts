// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CalendarClock, ShieldCheck, UserCheck, Video } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { LandingSectionProps } from "./types"

/**
 * The four things this block actually does, one card each. Icons are lucide
 * (bundled) rather than hotlinked SVGs — nothing here depends on the CDN
 * being reachable.
 */
const FEATURES = [
  { key: "timetable", Icon: CalendarClock },
  { key: "recording", Icon: Video },
  { key: "attendance", Icon: UserCheck },
  { key: "access", Icon: ShieldCheck },
] as const

export function ConferenceFeaturesSection({ dictionary }: LandingSectionProps) {
  const f = dictionary?.landing?.features

  return (
    <section className="mb-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map(({ key, Icon }) => (
        <Card
          key={key}
          className="hover:border-foreground border shadow-none transition-colors"
        >
          <CardHeader>
            <div className="text-foreground mb-4 flex h-12 w-12 items-end">
              <Icon className="size-9" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <CardTitle className="text-start">{f?.[key]?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-start text-sm leading-relaxed">
              {f?.[key]?.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
