// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"

import type { LandingSectionProps } from "./types"

// The order a school actually sets this up in. Each step links to the page
// that does it, so the section doubles as the setup checklist an empty tenant
// needs on day one.
const STEPS = [
  {
    key: "fleet",
    path: "vehicles",
    title: "Register the fleet",
    description:
      "Add each bus and van with its capacity, then the drivers who take them out.",
  },
  {
    key: "routes",
    path: "routes",
    title: "Draw the routes",
    description:
      "Place the stops, set departure and return times, and assign students to a pickup point.",
  },
  {
    key: "run",
    path: "trips",
    title: "Run the day",
    description:
      "Trips are scheduled overnight. Start one and boarding is recorded stop by stop.",
  },
]

interface Props extends LandingSectionProps {
  /** Ops roles get the step links; everyone else reads the steps only. */
  canOpenSteps: boolean
}

export function HowItWorksSection({ dictionary, lang, canOpenSteps }: Props) {
  const t = dictionary?.landing?.howItWorks

  return (
    <section>
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">
          {t?.title || "How a school gets rolling"}
        </h2>
      </div>

      <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
        {STEPS.map((step, index) => {
          const item = t?.steps?.[index]
          const title = item?.title || step.title
          const href = `/${lang}/transportation/${step.path}`

          return (
            <li key={step.key} className="text-start">
              <span className="text-muted-foreground mb-4 block text-5xl font-extrabold tabular-nums opacity-30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3
                className={cn(
                  "mb-3 text-lg font-bold md:text-xl",
                  canOpenSteps && "hover:text-primary transition-colors"
                )}
              >
                {canOpenSteps ? <Link href={href}>{title}</Link> : title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
                {item?.description || step.description}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
