// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SectionHeading as SectionHeadingType } from "../types"

interface Props {
  section: SectionHeadingType
}

export function SectionHeadingComponent({ section }: Props) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-heading mb-2 text-2xl font-bold md:text-3xl">
        {section.heading}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mx-auto max-w-2xl">
          {section.description}
        </p>
      )}
    </div>
  )
}
