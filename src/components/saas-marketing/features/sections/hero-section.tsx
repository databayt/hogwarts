// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageHeader } from "@/components/atom/page-header"

import type { HeroSection } from "../types"

interface Props {
  section: HeroSection
  title?: string
  description?: string
}

export function HeroSectionComponent({ section, title, description }: Props) {
  return (
    <PageHeader
      heading={title || section.heading}
      description={description || section.description}
      className="mb-8"
    />
  )
}
