// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LandingSectionProps } from "./types"

/**
 * The three steps from "we have a timetable" to "the class is running", in the
 * order an admin actually performs them. Numbered rather than illustrated —
 * this is operational instruction, not marketing.
 */
const STEPS = ["one", "two", "three"] as const

export function ConferenceHowToSection({ dictionary }: LandingSectionProps) {
  const h = dictionary?.landing?.howTo

  return (
    <section className="mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
        {h?.title}
      </h2>

      <ol className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step} className="text-start">
            <span className="border-foreground text-foreground mb-4 flex size-10 items-center justify-center rounded-full border text-sm font-semibold tabular-nums">
              {index + 1}
            </span>
            <h3 className="mb-2 text-lg font-semibold">
              {h?.steps?.[step]?.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {h?.steps?.[step]?.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
