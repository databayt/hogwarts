// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BellRing, CalendarX2, Route, Wallet } from "lucide-react"

import type { LandingSectionProps } from "./types"

// The four things this block does that a spreadsheet can't — each one is real
// machinery, not a promise: bell-time ETAs (lib/eta.ts), absence-aware
// re-routing (lib/absence.ts + the nightly build-tomorrow-trips cron), guardian
// alerts (in-app + WhatsApp), and the monthly fee projection finance reads.
const CAPABILITIES = [
  {
    Icon: Route,
    title: "Routes that sequence themselves",
    description:
      "Stops are ordered for the shortest run, with live traffic folded into the estimate.",
  },
  {
    Icon: BellRing,
    title: "Arrival timed to the bell",
    description:
      "Pickup times are worked backwards from first period, so nobody waits and nobody is late.",
  },
  {
    Icon: CalendarX2,
    title: "Absences drop the stop",
    description:
      "A student marked away overnight is skipped, and the route re-optimizes without them.",
  },
  {
    Icon: Wallet,
    title: "Fees follow the route",
    description:
      "Each route carries its monthly fee, projected per student for finance to bill.",
  },
]

export function CapabilitiesSection({ dictionary }: LandingSectionProps) {
  const t = dictionary?.landing?.capabilities

  return (
    <section className="bg-primary text-primary-foreground rounded-xl py-16">
      <div className="px-6">
        <div className="flex flex-col items-start gap-12 md:flex-row">
          <div className="text-start md:w-1/2">
            <h2 className="mb-4 text-4xl leading-tight font-bold">
              {t?.title || "More than a list of buses"}
            </h2>
            <p className="max-w-[70%] text-lg leading-relaxed opacity-80">
              {t?.description ||
                "Planning, timing, absences and fees all run off the same routes you already drew."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:w-1/2">
            {CAPABILITIES.map((capability, index) => {
              const Icon = capability.Icon
              const item = t?.items?.[index]
              return (
                <div key={capability.title} className="text-start">
                  <div className="mb-4 flex h-14 items-end">
                    <Icon className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">
                    {item?.title || capability.title}
                  </h3>
                  <p className="text-sm leading-relaxed opacity-70">
                    {item?.description || capability.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
