// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { RoleCardsSection } from "../types"
import { InfoCard } from "./info-card"

interface Props {
  section: RoleCardsSection
}

export function RoleCardsSectionComponent({ section }: Props) {
  const cols =
    section.cards.length % 4 === 0
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <section className="mb-16">
      <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
        {section.heading}
      </h2>
      <div className={`grid gap-4 ${cols}`}>
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
