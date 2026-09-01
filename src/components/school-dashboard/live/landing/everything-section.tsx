// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Activity, Link2, PlaySquare, Video } from "lucide-react"

import type { LandingSectionProps } from "./types"

/**
 * The full-bleed value band, mirroring lumos' curriculum section.
 *
 * Unlike lumos' band this uses semantic tokens rather than a literal hex, so
 * it inverts correctly in dark mode instead of staying a fixed blue.
 */
const ITEMS = [
  { key: "rooms", Icon: Video },
  { key: "links", Icon: Link2 },
  { key: "recordings", Icon: PlaySquare },
  { key: "diagnostics", Icon: Activity },
] as const

export function ConferenceEverythingSection({
  dictionary,
}: LandingSectionProps) {
  const e = dictionary?.landing?.everything

  return (
    <section className="bg-primary text-primary-foreground mb-24 rounded-xl py-16">
      <div className="px-6 sm:px-8">
        <div className="flex flex-col items-start gap-12 md:flex-row">
          <div className="text-start md:w-1/2">
            <h2 className="mb-4 text-3xl leading-tight font-bold md:text-4xl">
              {e?.title}
            </h2>
            <p className="max-w-[85%] text-lg leading-relaxed opacity-80">
              {e?.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:w-1/2">
            {ITEMS.map(({ key, Icon }) => (
              <div key={key} className="text-start">
                <div className="mb-4 flex h-14 items-end">
                  <Icon
                    className="size-10"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mb-3 text-lg font-semibold">
                  {e?.items?.[key]?.title}
                </h3>
                <p className="text-sm leading-relaxed opacity-70">
                  {e?.items?.[key]?.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
