// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageSection } from "../types"
import { AlternatingBlocksSectionComponent } from "./alternating-blocks-section"
import { BenefitsGridSectionComponent } from "./benefits-grid-section"
import { ChecklistSectionComponent } from "./checklist-section"
import { CtaBannerSectionComponent } from "./cta-banner-section"
import { FeatureCardsSectionComponent } from "./feature-cards-section"
import { HeroSectionComponent } from "./hero-section"
import { RoleCardsSectionComponent } from "./role-cards-section"
import { SectionHeadingComponent } from "./section-heading"
import { StatsBarSectionComponent } from "./stats-bar-section"

interface Props {
  section: FeaturePageSection
  lang: string
  ctaLabel: string
}

export function SectionRenderer({ section, lang, ctaLabel }: Props) {
  switch (section.type) {
    case "hero":
      return <HeroSectionComponent section={section} />
    case "role-cards":
      return <RoleCardsSectionComponent section={section} />
    case "benefits-grid":
      return <BenefitsGridSectionComponent section={section} />
    case "stats-bar":
      return <StatsBarSectionComponent section={section} />
    case "feature-cards":
      return <FeatureCardsSectionComponent section={section} />
    case "cta-banner":
      return (
        <CtaBannerSectionComponent
          section={section}
          lang={lang}
          ctaLabel={ctaLabel}
        />
      )
    case "checklist":
      return <ChecklistSectionComponent section={section} />
    case "alternating-blocks":
      return <AlternatingBlocksSectionComponent section={section} />
    case "section-heading":
      return <SectionHeadingComponent section={section} />
  }
}
