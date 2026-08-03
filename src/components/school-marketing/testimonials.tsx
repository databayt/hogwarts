"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * A static grid of real parent quotes, not a marquee -- calmer, and it
 * sidesteps the stale-DOM-clone bug the old InfiniteMovingCards carried
 * (nodes cloned for the loop before the dictionary had finished loading).
 */
export function Testimonials() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.testimonials
  if (!t) return null

  const stats = t.stats ?? []
  const items = t.items ?? []

  return (
    <section className="band-cool bleed-page px-page capsule-t capsule-b section-y">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="display-2">{t.title}</h2>
        <p className="display-intro band-muted mt-4">{t.description}</p>
      </div>

      {stats.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="display-2">{stat.value}</div>
              <div className="band-muted mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <figure
              key={index}
              className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm"
            >
              <blockquote className="text-lg">{item.quote}</blockquote>
              <figcaption className="mt-4">
                <div className="font-semibold">{item.name}</div>
                <div className="band-muted text-sm">{item.title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}
