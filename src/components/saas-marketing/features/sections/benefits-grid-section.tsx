// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { BenefitsGridSection } from "../types"
import { InfoCard } from "./info-card"

interface Props {
  section: BenefitsGridSection
}

export function BenefitsGridSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          {section.heading}
        </h2>
        {section.description && (
          <p className="text-muted-foreground mt-3 text-pretty">
            {section.description}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => (
          <InfoCard
            key={item.title}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  )
}
