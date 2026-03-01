// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { BenefitsGridSection } from "../types"

interface Props {
  section: BenefitsGridSection
}

export function BenefitsGridSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      <h2 className="font-heading mb-2 text-center text-2xl font-bold md:text-3xl">
        {section.heading}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-center">
          {section.description}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {section.items.map((item) => (
          <div key={item.title} className="rounded-lg border p-6">
            <div className="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-full" />
            <h3 className="mb-2 font-semibold">{item.title}</h3>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
