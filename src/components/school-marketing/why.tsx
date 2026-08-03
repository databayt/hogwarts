// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

interface WhyProps {
  dictionary?: Dictionary
}

/**
 * Apple's "Why Apple is the best place to buy Mac" rail
 * (features/imported/apple/why-apple-mac.tsx), re-cut for our six reasons
 * and our own dictionary/design tokens. That reference drives the rail with
 * a ref, a scroll listener, and two paddle buttons with hand-written RTL
 * flips; this one leans on native overflow-x + scroll-snap instead, which
 * already scrolls the right direction under <html dir="rtl"> for free and
 * has no scrollLeft math to get backwards.
 */
export function Why({ dictionary }: WhyProps) {
  const t = dictionary?.marketing?.site?.why
  const titleLines = (t?.title ?? "").split("\n").filter(Boolean)
  const items = (t?.items ?? []) as Array<{
    topic: string
    headline: string
    body: string
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

      <div className="bleed-page mt-10">
        <div className="px-page no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto">
          {items.map((item) => (
            <article
              key={item.topic}
              className="bg-card text-card-foreground w-[80vw] shrink-0 snap-start rounded-3xl border p-8 sm:w-[380px]"
            >
              <p className="eyebrow">{item.topic}</p>
              <h3 className="display-3 mt-4">{item.headline}</h3>
              <p className="text-muted-foreground mt-4">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
