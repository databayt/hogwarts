// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Card from "@/components/atom/card"

import type { Feature } from "../types"
import { Glyph } from "./glyph"

interface Props {
  features: Feature[]
  lang: string
  heading: string
}

export function RelatedFeatures({ features, lang, heading }: Props) {
  if (features.length === 0) return null

  return (
    <section className="mb-16">
      <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
        {heading}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((rf) => (
          <Card
            key={rf.id}
            id={rf.id}
            title={rf.title}
            description={rf.description}
            icon={<Glyph title={rf.title} size={32} />}
            href={`/${lang}/features/${rf.id}`}
          />
        ))}
      </div>
    </section>
  )
}
