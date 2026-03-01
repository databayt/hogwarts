"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { InfiniteSlider } from "@/components/atom/infinite-slider"
import { ProgressiveBlur } from "@/components/atom/progressive-blur"
import { useDictionary } from "@/components/internationalization/use-dictionary"

const fallbackItems = [
  "Ministry of Magic",
  "Diagon Alley",
  "Gringotts Bank",
  "St. Mungo\u2019s Hospital",
  "Quidditch League",
  "Ollivanders",
  "Daily Prophet",
  "Beauxbatons Academy",
]

export default function LogoCloud() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.logoCloud

  const items = (t?.items as string[]) || fallbackItems

  return (
    <section className="overflow-hidden py-16 md:py-24">
      <div className="flex flex-col items-center md:flex-row">
        <div className="shrink-0 md:border-e md:pe-6">
          <p className="text-base font-medium">
            {(t?.trustedBy as string) || "Trusted by magical institutions"}
          </p>
        </div>
        <div className="relative flex-1 overflow-hidden py-6" dir="ltr">
          <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
            {items.map((name, index) => (
              <div key={index} className="flex items-center">
                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                  {name}
                </span>
              </div>
            ))}
          </InfiniteSlider>

          <div className="from-background absolute inset-y-0 start-0 w-20 bg-linear-to-r"></div>
          <div className="from-background absolute inset-y-0 end-0 w-20 bg-linear-to-l"></div>
          <ProgressiveBlur
            className="pointer-events-none absolute start-0 top-0 h-full w-20"
            direction="left"
            blurIntensity={1}
          />
          <ProgressiveBlur
            className="pointer-events-none absolute end-0 top-0 h-full w-20"
            direction="right"
            blurIntensity={1}
          />
        </div>
      </div>
    </section>
  )
}
