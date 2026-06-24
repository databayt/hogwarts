// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Check } from "lucide-react"

import type { ChecklistSection } from "../types"

interface Props {
  section: ChecklistSection
}

export function ChecklistSectionComponent({ section }: Props) {
  return (
    <section className="mb-16">
      <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
        {section.heading}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => (
          <li
            key={item.text}
            className="bg-background flex items-center gap-3 rounded-lg border p-4"
          >
            <Check
              className="text-primary size-5 shrink-0"
              strokeWidth={2.25}
            />
            <span className="text-sm font-medium">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
