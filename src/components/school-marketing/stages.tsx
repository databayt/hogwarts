// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface StagesProps {
  lang?: Locale
  dictionary?: Dictionary
}

const BANDS = ["band-sand", "band-ink", "band-warm"] as const

/**
 * Apple's 2-up promo tile grid, carrying the school's three stages. The
 * first tile spans both columns and the other two sit side by side -- that
 * asymmetry, not an even 3-up grid, is the apple.com rhythm this is copying.
 *
 * Tiles cycle the three color bands instead of a photograph, so the grid
 * still reads as a set of colored panels; corners stay sharp, matching
 * Apple's own promo tiles, which never round.
 */
export function Stages({ lang = "en", dictionary }: StagesProps) {
  const t = dictionary?.marketing?.site?.stages
  const titleLines = (t?.title ?? "").split("\n").filter(Boolean)
  const items = (t?.items ?? []) as Array<{
    name: string
    ages: string
    summary: string
    cta: string
  }>

  if (items.length === 0) return null

  return (
    <section className="section-y">
      <div className="max-w-2xl">
        {t?.eyebrow && <p className="eyebrow">{t.eyebrow}</p>}
        <h2 className="display-2 mt-4">
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>
        {t?.description && (
          <p className="display-intro mt-6">{t.description}</p>
        )}
      </div>

      <div className="bleed-page mt-10 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
        {items.map((item, i) => (
          <div
            key={item.name}
            className={cn(
              "tile px-6 text-center sm:px-10",
              BANDS[i % BANDS.length],
              i === 0 && "md:col-span-2"
            )}
          >
            <p className="eyebrow">{item.ages}</p>
            <h3 className="display-3 mt-3">{item.name}</h3>
            <p className="band-muted mt-4 max-w-md">{item.summary}</p>
            <Link
              href={`/${lang}/academic`}
              className="mt-6 text-sm font-semibold underline underline-offset-4"
            >
              {item.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
