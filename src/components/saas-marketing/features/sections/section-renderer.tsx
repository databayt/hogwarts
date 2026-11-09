// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageSection } from "../types"
import { AlternatingBlocksSectionComponent } from "./alternating-blocks-section"
import { BenefitsGridSectionComponent } from "./benefits-grid-section"
import { ChecklistSectionComponent } from "./checklist-section"
import { FeatureCardsSectionComponent } from "./feature-cards-section"
import { HeroSectionComponent } from "./hero-section"
import { RoleCardsSectionComponent } from "./role-cards-section"
import { SectionHeadingComponent } from "./section-heading"
import { StatsBarSectionComponent } from "./stats-bar-section"

interface Props {
  section: FeaturePageSection
  title?: string
  description?: string
}

export function SectionRenderer({ section, title, description }: Props) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSectionComponent
          section={section}
          title={title}
          description={description}
        />
      )
    case "role-cards":
      return <RoleCardsSectionComponent section={section} />
    case "benefits-grid":
      return <BenefitsGridSectionComponent section={section} />
    case "stats-bar":
      return <StatsBarSectionComponent section={section} />
    case "feature-cards":
      return <FeatureCardsSectionComponent section={section} />
    case "cta-banner":
      // The page closes on one call to action (BottomCta); a second banner
      // mid-page repeated it. Kept in the data, not drawn.
      return null
    case "checklist":
      return <ChecklistSectionComponent section={section} />
    case "alternating-blocks":
      return <AlternatingBlocksSectionComponent section={section} />
    case "section-heading":
      return <SectionHeadingComponent section={section} />
  }
}
