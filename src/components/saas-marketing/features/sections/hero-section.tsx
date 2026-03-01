// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { HeroSection } from "../types"
import { ImagePlaceholder } from "./image-placeholder"

interface Props {
  section: HeroSection
}

export function HeroSectionComponent({ section }: Props) {
  return (
    <section className="mb-16 grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          {section.heading}
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          {section.description}
        </p>
      </div>
      <ImagePlaceholder aspectRatio="video" />
    </section>
  )
}
