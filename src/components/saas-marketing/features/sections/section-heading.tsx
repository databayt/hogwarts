// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SectionHeading as SectionHeadingType } from "../types"

interface Props {
  section: SectionHeadingType
}

export function SectionHeadingComponent({ section }: Props) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
        {section.heading}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mt-3 text-pretty">
          {section.description}
        </p>
      )}
    </div>
  )
}
