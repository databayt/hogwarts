"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { InfiniteSlider } from "@/components/atom/infinite-slider"
import { ProgressiveBlur } from "@/components/atom/progressive-blur"
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * The subjects the school actually teaches, running as a marquee.
 *
 * This replaced a "trusted by" logo cloud. A shared marketing template can't
 * carry partner logos -- whatever it listed would be a claim the tenant school
 * never made. Subjects are the school's own truth and fill the same band.
 *
 * The track is forced to `dir="ltr"` so the slider's transform math runs the
 * same way in both locales. Each subject is an independent run of text, so
 * Arabic still shapes correctly inside it; only the order of the list flips,
 * which carries no meaning here.
 */
export default function Trust() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.trust

  if (!t) return null

  const items = (t.items as string[]) ?? []
  if (items.length === 0) return null

  return (
    <section className="bleed-page band-sand overflow-hidden">
      <div className="px-page section-y">
        <div className="flex flex-col items-center md:flex-row">
          <div className="shrink-0 md:border-e md:pe-6">
            <p className="eyebrow">{t.label}</p>
          </div>

          <div className="relative flex-1 overflow-hidden py-6" dir="ltr">
            <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
              {items.map((name, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-lg font-medium whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
            </InfiniteSlider>

            <div className="from-band-sand absolute inset-y-0 start-0 w-20 bg-linear-to-r" />
            <div className="from-band-sand absolute inset-y-0 end-0 w-20 bg-linear-to-l" />
            <ProgressiveBlur
              className="pointer-events-none absolute inset-y-0 start-0 w-20"
              direction="left"
              blurIntensity={1}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute inset-y-0 end-0 w-20"
              direction="right"
              blurIntensity={1}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
