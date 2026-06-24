// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Verbatim sections ported from the zenda + apple clones, rendered below the
// feature-detail content. zenda sections run under the `.zenda-clone` CSS scope
// (src/styles/zenda-clone.css) so they keep their Webflow look + GSAP; apple
// sections are self-contained Tailwind + paddle-nav. Both groups break full
// bleed out of the centered marketing container.

import { cn } from "@/lib/utils"

import { StoreHero } from "./apple/store"
import { MacWhyApple } from "./apple/why-apple-mac"
import { HowItWorks } from "./zenda/how-it-works"
import { Services as MoreEase } from "./zenda/more-ease"
import { Features as SmarterTransactions } from "./zenda/services"
import { Stats } from "./zenda/stats"
import { Testimonials } from "./zenda/testimonials"

function FullBleed({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "relative ml-[calc(50%-50vw)] w-screen overflow-x-clip",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ImportedSections() {
  return (
    <div className="mt-16">
      <FullBleed className="zenda-clone">
        <HowItWorks />
        <Testimonials />
        <SmarterTransactions />
        <Stats />
        <MoreEase />
      </FullBleed>
      <FullBleed>
        <StoreHero />
        <MacWhyApple />
      </FullBleed>
    </div>
  )
}
