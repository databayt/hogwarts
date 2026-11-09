// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { RoleCardsSection } from "../types"
import { InfoCard } from "./info-card"
import { SectionTitle } from "./section-title"

interface Props {
  section: RoleCardsSection
}

export function RoleCardsSectionComponent({ section }: Props) {
  const cols =
    section.cards.length % 4 === 0
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <section>
      <SectionTitle title={section.heading} />
      <div className={`grid gap-x-8 gap-y-10 ${cols}`}>
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
