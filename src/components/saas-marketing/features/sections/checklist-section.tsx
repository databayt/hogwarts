// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Check } from "lucide-react"

import type { ChecklistSection } from "../types"
import { ImagePlaceholder } from "./image-placeholder"

interface Props {
  section: ChecklistSection
}

export function ChecklistSectionComponent({ section }: Props) {
  return (
    <section className="mb-16 grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <ImagePlaceholder aspectRatio="video" />
      <div>
        <h2 className="font-heading mb-6 text-2xl font-bold md:text-3xl">
          {section.heading}
        </h2>
        <ul className="space-y-3">
          {section.items.map((item) => (
            <li key={item.text} className="flex items-start gap-3">
              <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
