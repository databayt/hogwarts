// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SectionHeading as SectionHeadingType } from "../types"
import { SectionTitle } from "./section-title"

interface Props {
  section: SectionHeadingType
}

export function SectionHeadingComponent({ section }: Props) {
  return (
    <SectionTitle
      title={section.heading}
      description={section.description}
      className="mb-0 md:mb-0"
    />
  )
}
