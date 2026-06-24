// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeatureCardsSection } from "../types"
import { InfoCard } from "./info-card"

interface Props {
  section: FeatureCardsSection
}

export function FeatureCardsSectionComponent({ section }: Props) {
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
        {section.cards.map((card) => (
          <InfoCard
            key={card.title}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </section>
  )
}
