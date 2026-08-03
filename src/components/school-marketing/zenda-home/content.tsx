// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/content). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

import { Benefits } from "./benefits"
import { CTA } from "./cta"
import { Hero } from "./hero"
import { HowItWorks } from "./how-it-works"
import { PhoneMockup } from "./phone-mockup"
import { Rewards } from "./rewards"
import { Schools } from "./schools"
import { Testimonials } from "./testimonials"

export function HomeContent({ lang = "en" }: { lang?: string }) {
  return (
    <>
      <Hero lang={lang} />
      <PhoneMockup />
      <Rewards />
      <Schools />
      <HowItWorks />
      <Testimonials />
      <Benefits />
      <CTA />
    </>
  )
}
