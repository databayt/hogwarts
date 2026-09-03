// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server components: pure prop composition, no client hooks or handlers.

import Image from "next/image"
import Link from "next/link"
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Link2,
  Play,
  Radio,
} from "lucide-react"

import { ShelfCard, shelfScroller } from "@/components/lumos/shared/shelf-card"

/**
 * Everything under the room's title card.
 *
 * The reference app's page does not stop at its poster: under it run an
 * episode shelf, a bonus-content shelf, a related row and a cast-and-crew row,
 * and the page carries on well past the fold. The room's card had none of
 * that, which is what made it a screen rather than a page.
 *
 * Four shelves, one heading, one tile. What each shelf HOLDS is decided in
 * `queries.ts` and resolved — translated, formatted in the school's zone — by
 * the page; these components only lay it out.
 */

// ---------------------------------------------------------------------------
// The heading
// ---------------------------------------------------------------------------

/**
 * The reference has TWO heading styles and uses both deliberately: its season
 * heading is entirely blue because the whole thing is a control (it opens a
 * season picker), while `Bonus Content`, `Related` and `Cast & Crew` are plain
 * headings with a blue `See All` set at the far end.
 *
 * Ours keeps that split, with one change to the first: a chevron pointing DOWN
 * promises a picker, and there is nothing here to pick, so it points forward
 * and the heading is a link. Mirrored under RTL, because it points through the
 * reading order rather than through time.
 */
function ShelfHeading({
  title,
  href,
  seeAll,
  accent,
}: {
  title: string
  href?: string
  /** The blue link at the far end. Rendered only with an `href` to give it. */
  seeAll?: string
  accent?: boolean
}) {
  if (accent && href) {
    return (
      <Link
        href={href}
        // Literal hex rather than a token, for the reason the card above it
        // pins its own colours: this surface is black in both themes, and a
        // theme-aware accent would resolve to the light-mode blue on a page
        // that is never light. Same iOS accent the reference heading uses.
        className="inline-flex items-center gap-0.5 text-[17px] font-semibold text-[#0A84FF] transition-opacity hover:opacity-80"
      >
        {title}
        <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
      </Link>
    )
  }
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[17px] font-semibold text-white">{title}</h2>
      {href && seeAll && (
        <Link
          href={href}
          className="shrink-0 text-[15px] font-medium text-[#0A84FF] transition-opacity hover:opacity-80"
        >
          {seeAll}
        </Link>
      )}
    </div>
  )
}

/** The band a shelf sits in. Black to the foot of the page, like the card's. */
function Shelf({
  children,
  ...heading
}: React.ComponentProps<typeof ShelfHeading> & { children: React.ReactNode }) {
  return (
    <section className="space-y-3 px-4 pt-2 pb-6 sm:px-6">
      <ShelfHeading {...heading} />
      <div className={shelfScroller}>{children}</div>
    </section>
  )
}

/** Everything under the card, on one black ground. */
export function RoomPageSections({ children }: { children: React.ReactNode }) {
  return <div className="bg-black pb-10">{children}</div>
}

// ---------------------------------------------------------------------------
// The class's own series — the reference's "Season 2"
// ---------------------------------------------------------------------------

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
  /** The subject. */
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
  live: string
  recorded: string
}

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
    <Shelf title={labels.heading} href={seeAllHref} accent>
      {items.map((item) => (
        <ShelfCard
          key={item.id}
          href={item.href}
          titleBelow
          aspectClassName="aspect-video"
          thumbnailUrl={item.thumbnailUrl}
          color={item.color}
          // The reference's `EPISODE 1` slot. When a class runs is the nearest
          // thing a class has to an episode number — it is what orders them.
          eyebrow={[item.day, item.time].filter(Boolean).join(" · ") || null}
          title={item.title}
          blurb={
            [item.lesson, item.durationLabel].filter(Boolean).join(" · ") ||
            null
          }
          overlay={
            /* The two states worth reading before the eye reaches the name:
               whether the room is open RIGHT NOW, and — since the tile quietly
               links somewhere else when it is true — whether there is a
               recording behind it. */
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
        />
      ))}
    </Shelf>
  )
}

// ---------------------------------------------------------------------------
// What the class comes with — the reference's "Bonus Content"
// ---------------------------------------------------------------------------

/**
 * A reference attached to the class: an exam to sit, an assignment to hand in,
 * or a link to read. `ConferenceResource` carries exactly ONE of the three per
 * row, which is why `kind` is a discriminator rather than three optional
 * fields.
 */
export interface RoomBonusItem {
  id: string
  href: string
  kind: "exam" | "assignment" | "link"
  title: string
  /** The date it is due or set for, already formatted in the school's zone. */
  detail: string | null
}

const BONUS_ICON = {
  exam: FileText,
  assignment: ClipboardList,
  link: Link2,
} as const

export function RoomBonusShelf({
  items,
  labels,
  color,
}: {
  items: RoomBonusItem[]
  labels: { heading: string; exam: string; assignment: string; link: string }
  /** The subject's colour, which is the ground these tiles get — a reference
   *  has no artwork of its own and never will. */
  color: string | null
}) {
  if (items.length === 0) return null

  return (
    <Shelf title={labels.heading}>
      {items.map((item) => {
        const Icon = BONUS_ICON[item.kind]
        return (
          <ShelfCard
            key={item.id}
            href={item.href}
            titleBelow
            aspectClassName="aspect-video ring-1 ring-white/10 ring-inset"
            color={color}
            art={<Icon className="size-10" aria-hidden />}
            eyebrow={labels[item.kind]}
            title={item.title}
            blurb={item.detail}
          />
        )
      })}
    </Shelf>
  )
}

// ---------------------------------------------------------------------------
// Where to go next — the reference's "Related"
// ---------------------------------------------------------------------------

export interface RoomRelatedItem {
  id: string
  href: string
  title: string
  chapter: string | null
  durationLabel: string | null
  thumbnailUrl: string | null
  color: string | null
}

/**
 * The subject's self-study lessons.
 *
 * The reference's related row is artwork ALONE — no names — which works there
 * because every tile is a branded show poster that says what it is. A catalog
 * lesson's artwork is a generic illustration shared across a whole subject, so
 * a nameless row here would be a row of pictures nobody could choose between.
 * The names stay.
 */
export function RoomRelatedShelf({
  items,
  labels,
  seeAllHref,
}: {
  items: RoomRelatedItem[]
  labels: { heading: string; seeAll: string }
  seeAllHref: string | null
}) {
  if (items.length === 0) return null

  return (
    <Shelf
      title={labels.heading}
      href={seeAllHref ?? undefined}
      seeAll={labels.seeAll}
    >
      {items.map((item) => (
        <ShelfCard
          key={item.id}
          href={item.href}
          titleBelow
          aspectClassName="aspect-video"
          thumbnailUrl={item.thumbnailUrl}
          color={item.color}
          eyebrow={item.chapter}
          title={item.title}
          blurb={item.durationLabel}
        />
      ))}
    </Shelf>
  )
}

// ---------------------------------------------------------------------------
// Who is in it — the reference's "Cast & Crew"
// ---------------------------------------------------------------------------

export interface RoomPerson {
  id: string
  name: string
  /** What they are to this class: the teacher, or a student in it. */
  role: string
  photoUrl: string | null
}

/**
 * The host, then the roster.
 *
 * Circular portraits with the name and the role under them, which is the
 * reference's shape exactly. Whether the roster is included at all is decided
 * in `findRoomClassPeople` — it is a privacy boundary, not a layout choice.
 */
export function RoomPeopleShelf({
  people,
  labels,
}: {
  people: RoomPerson[]
  labels: { heading: string }
}) {
  if (people.length === 0) return null

  return (
    <Shelf title={labels.heading}>
      {people.map((person) => (
        <div key={person.id} className="w-24 shrink-0 text-center">
          <div className="relative mx-auto size-20 overflow-hidden rounded-full bg-white/10">
            {person.photoUrl ? (
              <Image
                src={person.photoUrl}
                alt={person.name}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-lg font-semibold text-white/70">
                {/* The first letter of the name AS WRITTEN — never a Latin
                    transliteration, which is what an initials helper keyed on
                    ASCII would produce for an Arabic roster. */}
                {Array.from(person.name)[0] ?? ""}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-[13px] leading-tight font-medium text-white">
            {person.name}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[12px] text-white/50">
            {person.role}
          </p>
        </div>
      ))}
    </Shelf>
  )
}
