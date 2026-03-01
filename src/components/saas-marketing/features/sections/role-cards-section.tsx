// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { RoleCardsSection } from "../types"

interface Props {
  section: RoleCardsSection
}

export function RoleCardsSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      <h2 className="font-heading mb-8 text-center text-2xl font-bold md:text-3xl">
        {section.heading}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {section.cards.map((card) => (
          <div key={card.title} className="rounded-lg border p-6 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" />
            <h3 className="mb-2 font-semibold">{card.title}</h3>
            <p className="text-muted-foreground text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
