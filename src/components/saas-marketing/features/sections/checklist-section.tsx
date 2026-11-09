// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Check } from "lucide-react"

import type { ChecklistSection } from "../types"
import { SectionTitle } from "./section-title"

interface Props {
  section: ChecklistSection
}

/** What the module includes — a plain two-column tick list, no chips. */
export function ChecklistSectionComponent({ section }: Props) {
  return (
    <section>
      <SectionTitle title={section.heading} />
      <ul className="grid gap-x-12 gap-y-4 sm:grid-cols-2">
        {section.items.map((item) => (
          <li key={item.text} className="flex items-start gap-3 text-base">
            <Check
              className="text-primary mt-0.5 size-5 shrink-0"
              strokeWidth={2.25}
            />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
