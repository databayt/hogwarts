// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ZendaButton } from "../shared/zenda-button"
import { AdmissionHeroIllustration } from "./hero-illustration"

interface AdmissionHeroProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionHero({ lang, dictionary }: AdmissionHeroProps) {
  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.admission?.hero

  // The title breaks where the dictionary says it breaks -- a hero headline is
  // typeset, not reflowed. Any number of lines, so a translation can take more
  // or fewer than English (a fixed two-span render dropped everything after
  // the second line and printed an empty span when there was only one).
  const titleParts = t?.title?.split("\n") ?? [
    "A great journey",
    "is about to begin.",
  ]

  // 5.5rem ~= the zenda nav's rendered height (84.5px). Colors are pinned to
  // the light scheme -- the page lives on the zenda cream, which never flips.
  //
  // Type and buttons run on the .zenda-* primitives (school-marketing.css), so
  // the first heading under the zenda nav speaks the nav's face and weight
  // instead of the app's display ramp. The rail itself -- content starting on
  // the same x as the nav logo -- is set by the route-scoped rule in
  // admissions/page.tsx, not here.
  return (
    <section id="hero" className="min-h-[calc(100svh-5.5rem)]">
      <div className="grid min-h-[calc(100svh-5.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: Content */}
        <div className="py-12 lg:py-0">
          <h1 className="zenda-heading">
            {titleParts.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          {/* 27rem is zenda's own lede measure -- one short line at 40px, which
           * is what this pattern is sized for. */}
          <p className="zenda-lede mt-6 max-w-[27rem]">
            {t?.subtitle ||
              "Your Hogwarts letter will be delivered by owl post on your 11th birthday. If you haven't received it by then, please check with your local Ministry of Magic office."}
          </p>

          {/* One pill, zenda's EXPLORE button in its default purple. The hero
           * offers a single action, as zenda's own does -- the page below is
           * the "learn more", so a second CTA pointing back at it was a link
           * to where the reader already is. */}
          <div className="mt-8 flex">
            <ZendaButton
              href={`/${lang}/application`}
              label={t?.startApplication || "Application"}
            />
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className="hidden items-center justify-center lg:flex lg:justify-end">
          <AdmissionHeroIllustration />
        </div>
      </div>
    </section>
  )
}
