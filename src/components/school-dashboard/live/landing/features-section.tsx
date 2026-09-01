// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { asset } from "@/lib/asset-url"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { LandingSectionProps } from "./types"

const FEATURES = [
  {
    key: "timetable",
    iconUrl: asset(
      "https://cdn.databayt.org/anthropic/stream-progress-tracking.svg"
    ),
  },
  {
    key: "recording",
    iconUrl: asset(
      "https://cdn.databayt.org/anthropic/stream-interactive-learning.svg"
    ),
  },
  {
    key: "attendance",
    iconUrl: asset(
      "https://cdn.databayt.org/anthropic/stream-curated-courses.svg"
    ),
  },
  {
    key: "access",
    iconUrl: asset("https://cdn.databayt.org/anthropic/stream-community.svg"),
  },
] as const

export function ConferenceFeaturesSection({ dictionary }: LandingSectionProps) {
  const f = dictionary?.landing?.features

  return (
    <section className="mb-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map(({ key, iconUrl }) => (
        <Card
          key={key}
          className="hover:border-foreground border shadow-none transition-colors"
        >
          <CardHeader>
            <div className="text-foreground mb-4 h-12 w-12 text-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
              />
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
