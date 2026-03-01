// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeatureCardsSection } from "../types"

interface Props {
  section: FeatureCardsSection
}

export function FeatureCardsSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      <h2 className="font-heading mb-2 text-center text-2xl font-bold md:text-3xl">
        {section.heading}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-center">
          {section.description}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {section.cards.map((card) => (
          <div key={card.title} className="rounded-lg border p-6">
            <div className="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-full" />
            <h3 className="mb-2 font-semibold">{card.title}</h3>
            <p className="text-muted-foreground text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
