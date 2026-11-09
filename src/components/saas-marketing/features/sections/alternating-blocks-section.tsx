// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AlternatingBlocksSection } from "../types"
import { InfoCard } from "./info-card"
import { SectionTitle } from "./section-title"

interface Props {
  section: AlternatingBlocksSection
}

/** Two-column list of longer blocks, in the same ruled style as every other
 * list on the page (InfoCard). */
export function AlternatingBlocksSectionComponent({ section }: Props) {
  return (
    <section>
      {section.heading && <SectionTitle title={section.heading} />}
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {section.blocks.map((block) => (
          <InfoCard
            key={block.heading}
            title={block.heading}
            description={block.description}
          />
        ))}
      </div>
    </section>
  )
}
