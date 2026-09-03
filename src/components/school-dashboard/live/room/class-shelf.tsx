// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition, no client hooks or handlers.

import Link from "next/link"
import { ChevronRight, Play, Radio } from "lucide-react"

import { ShelfCard, shelfScroller } from "@/components/lumos/shared/shelf-card"

/**
 * One tile's worth of a class. Everything is already RESOLVED — the subject
 * name has been through the translation cache and the time has been formatted
 * in the school's own zone — because neither is a thing this component could
 * do correctly: a client-side format uses the reader's device zone and a bare
 * server-side one uses the runtime's, which is UTC on Vercel.
 */
export interface RoomShelfItem {
  id: string
  href: string
  /** The subject, set over the artwork. */
  title: string
  /** The anchored lesson, when the session has one. Most do not. */
  lesson: string | null
  /** The weekday, when the class is NOT on the reader's own day — the shelf
   *  spans the days either side of now, and a bare "12:25 م" three tiles
   *  before "07:15 ص" reads as a row that lost its order. Null for today,
   *  which needs no saying. */
  day: string | null
  /** Already in the school's timezone. */
  time: string | null
  durationLabel: string | null
  isLive: boolean
  /** There is a `ready` recording behind this row AND the reader may watch
   *  one — both gates, resolved by the caller. */
  hasRecording: boolean
  thumbnailUrl: string | null
  color: string | null
}

export interface RoomShelfLabels {
  /** The blue heading — the section's name, or the school-wide fallback. */
  heading: string
  /** Where the heading points. */
  seeAll: string
  live: string
  recorded: string
}

/**
 * The row under the room's title card — the reference app's episode shelf.
 *
 * It exists because the room was a ONE-SCREEN page: a card, and then black to
 * the bottom of the viewport with nothing under it. The reference's phone page
 * is not a screen either; its poster block ends and the page carries on into
 * a shelf, which is the whole reason the poster is 4:5 rather than the height
 * of the display.
 *
 * What the shelf holds is the class's own series — see `findRoomShelfSessions`
 * for why that is the SECTION's other sessions and not the anchored lesson's
 * siblings.
 *
 * The heading is the reference's blue "Season 2 ⌄", with one deliberate
 * difference: its chevron points DOWN because it opens a season picker, and
 * there is nothing here to pick. A down chevron that opens nothing is a lie
 * about what the row can do, so it points forward instead and the heading is
 * a link to the classes page — the honest version of the same affordance,
 * mirrored under RTL because it points through the reading order.
 */
export function RoomClassShelf({
  items,
  labels,
  seeAllHref,
}: {
  items: RoomShelfItem[]
  labels: RoomShelfLabels
  seeAllHref: string
}) {
  if (items.length === 0) return null

  return (
    <section className="space-y-3 bg-black px-4 pt-2 pb-10 sm:px-6">
      <Link
        href={seeAllHref}
        // Literal hex rather than a token, for the reason the card above it
        // pins its own colours: this surface is black in both themes, and a
        // theme-aware accent would resolve to the light-mode blue on a page
        // that is never light. Same iOS accent the reference heading uses.
        className="inline-flex items-center gap-0.5 text-[17px] font-semibold text-[#0A84FF] transition-opacity hover:opacity-80"
        title={labels.seeAll}
      >
        {labels.heading}
        <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
      </Link>

      <div className={shelfScroller}>
        {items.map((item) => (
          <ShelfCard
            key={item.id}
            href={item.href}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            color={item.color}
            overlay={
              /* The two states worth reading before the eye reaches the glass
                 bar: whether the room is open RIGHT NOW, and — since the tile
                 quietly links somewhere else when it is true — whether there
                 is a recording behind it. */
              item.isLive ? (
                <span className="absolute end-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
                  <Radio className="size-3" aria-hidden />
                  {labels.live}
                </span>
              ) : item.hasRecording ? (
                <span className="absolute end-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Play className="size-2.5 fill-current" aria-hidden />
                  {labels.recorded}
                </span>
              ) : undefined
            }
            meta={
              /* When it runs, how long, and which lesson — in that order, and
                 the lesson is the only part allowed to lose characters. A
                 catalog lesson name can be a sentence; the clock time never
                 is, and it is the thing a reader is scanning the row for. */
              <>
                <Play className="size-3 shrink-0 fill-current" aria-hidden />
                {item.time ? (
                  <>
                    {item.day && <span className="shrink-0">{item.day}</span>}
                    <span className="shrink-0">{item.time}</span>
                    {item.durationLabel && (
                      <>
                        <span className="shrink-0">&middot;</span>
                        <span className="shrink-0">{item.durationLabel}</span>
                      </>
                    )}
                  </>
                ) : item.hasRecording ? (
                  <span className="shrink-0">{labels.recorded}</span>
                ) : null}
                {item.lesson && (
                  <>
                    <span className="shrink-0">&middot;</span>
                    <span className="truncate">{item.lesson}</span>
                  </>
                )}
              </>
            }
          />
        ))}
      </div>
    </section>
  )
}
