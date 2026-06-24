// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { HeroSection } from "../types"
import { Glyph } from "./glyph"

interface Props {
  section: HeroSection
}

export function HeroSectionComponent({ section }: Props) {
  return (
    <section className="mb-16 max-w-3xl">
      <Glyph title={section.heading} size={56} className="mb-6" />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-balance md:text-5xl md:leading-[1.08]">
        {section.heading}
      </h1>
      <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty md:text-xl">
        {section.description}
      </p>
    </section>
  )
}
