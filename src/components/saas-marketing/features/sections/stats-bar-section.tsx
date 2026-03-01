// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { StatsBarSection } from "../types"

interface Props {
  section: StatsBarSection
}

export function StatsBarSectionComponent({ section }: Props) {
  return (
    <section className="bg-muted/50 mb-16 rounded-2xl p-8 md:p-12">
      <div className="grid gap-8 md:grid-cols-3">
        {section.items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-primary mb-2 text-4xl font-bold md:text-5xl">
              {item.value}
            </p>
            <p className="text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
