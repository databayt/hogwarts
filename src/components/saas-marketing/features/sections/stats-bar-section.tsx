// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { StatsBarSection } from "../types"

interface Props {
  section: StatsBarSection
}

export function StatsBarSectionComponent({ section }: Props) {
  return (
    <section className="bg-muted/40 mb-16 rounded-2xl border p-8 md:p-12">
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {section.items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-heading text-4xl font-bold tracking-tight tabular-nums md:text-5xl">
              {item.value}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
