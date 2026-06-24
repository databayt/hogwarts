// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AlternatingBlocksSection } from "../types"
import { Glyph } from "./glyph"

interface Props {
  section: AlternatingBlocksSection
}

export function AlternatingBlocksSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      {section.heading && (
        <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
          {section.heading}
        </h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {section.blocks.map((block) => (
          <div
            key={block.heading}
            className="bg-background flex items-start gap-4 rounded-lg border p-6"
          >
            <Glyph title={block.heading} size={40} className="mt-0.5" />
            <div>
              <h3 className="font-semibold tracking-tight">{block.heading}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                {block.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
