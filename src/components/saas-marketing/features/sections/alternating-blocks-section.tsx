// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import type { AlternatingBlocksSection } from "../types"
import { ImagePlaceholder } from "./image-placeholder"

interface Props {
  section: AlternatingBlocksSection
}

export function AlternatingBlocksSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      {section.heading && (
        <h2 className="font-heading mb-10 text-center text-2xl font-bold md:text-3xl">
          {section.heading}
        </h2>
      )}
      <div className="space-y-12">
        {section.blocks.map((block, i) => (
          <div
            key={block.heading}
            className={cn(
              "grid items-center gap-8 md:grid-cols-2 md:gap-12",
              i % 2 === 1 && "md:[direction:rtl]"
            )}
          >
            <ImagePlaceholder aspectRatio="video" />
            <div className="md:[direction:ltr]">
              <h3 className="font-heading mb-3 text-xl font-bold">
                {block.heading}
              </h3>
              <p className="text-muted-foreground">{block.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
