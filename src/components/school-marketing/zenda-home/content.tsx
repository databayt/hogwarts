// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/content). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { Benefits } from "./benefits"
import { CTA } from "./cta"
import { Hero } from "./hero"
import { HowItWorks } from "./how-it-works"
import { PhoneMockup } from "./phone-mockup"
import { Rewards } from "./rewards"
import { Schools } from "./schools"
import { Testimonials } from "./testimonials"

interface HomeContentProps {
  lang?: string
  dictionary?: Dictionary
}

export function HomeContent({ lang = "en", dictionary }: HomeContentProps) {
  return (
    <>
      <Hero lang={lang} dictionary={dictionary} />
      <PhoneMockup dictionary={dictionary} />
      <Rewards lang={lang} dictionary={dictionary} />
      <Schools lang={lang} dictionary={dictionary} />
      <HowItWorks dictionary={dictionary} />
      <Testimonials dictionary={dictionary} />
      <Benefits dictionary={dictionary} />
      <CTA dictionary={dictionary} />
    </>
  )
}
