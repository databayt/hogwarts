// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: the only client code is the make-up sheet's own trigger.

import { typography } from "@/lib/typography"

import type { MakeupLabels } from "../makeup-badge"
import { MakeupSheet } from "../makeup-sheet"
import type { LandingMissed, LandingViewer } from "./types"

interface MissedShelfProps {
  missed: LandingMissed[]
  viewer: LandingViewer
  lang: string
  /** `liveClasses.makeup` — a different dictionary file from the landing's slice. */
  labels: MakeupLabels | undefined
}

/**
 * «حصص فائتة» — the classes a teacher (or an admin, for the school) can still
 * make up: cancelled or never started in the last 14 days, with no make-up yet.
 *
 * Shown to host roles only, and only when there is something to make up — an
 * empty shelf is a heading over nothing. Light on purpose: a row is text and
 * one button, no artwork; the sheet is the only client code.
 */
export function LiveMissedShelf({
  missed,
  viewer,
  lang,
  labels,
}: MissedShelfProps) {
  if (!viewer.isHost || missed.length === 0 || !labels) return null

  return (
    <section
      className="mb-16 flex w-full flex-col gap-y-4 border-b pb-16"
      aria-labelledby="live-missed-title"
    >
      <h2 id="live-missed-title" className={typography.h4}>
        {labels.missedTitle}
      </h2>

      <ul className="divide-y rounded-xl border">
        {missed.map((m) => {
          const what = [m.subjectName ?? m.title, m.sectionName]
            .filter(Boolean)
            .join(" · ")
          const when = labels.missedOn.replace("{date}", m.when)
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-semibold">
                  <bdi dir="auto">{what}</bdi>
                </p>
                <p className="text-muted-foreground text-sm">{when}</p>
              </div>
              <MakeupSheet
                missedId={m.id}
                labels={labels}
                lang={lang}
                description={`${what} — ${when}`}
                variant="outline"
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
