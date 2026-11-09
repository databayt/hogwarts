// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { BenefitsGridSection } from "../types"
import { InfoCard } from "./info-card"
import { SectionTitle } from "./section-title"

interface Props {
  section: BenefitsGridSection
}

export function BenefitsGridSectionComponent({ section }: Props) {
  return (
    <section>
      <SectionTitle title={section.heading} description={section.description} />
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
