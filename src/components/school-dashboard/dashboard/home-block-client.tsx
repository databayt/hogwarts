"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * The phone dashboard's first two rows, ported from the Android app's home
 * screen (feature/dashboard `HomeGrid` → `TopBlockLayout`).
 *
 * Android splits its top block into two equal slots separated by a 14dp gap:
 * an icon column carrying a 2x2 tile cluster, then a widget column carrying
 * the Smart Stack. The icon column is measured first and the widget is sized
 * to its footprint. A CSS grid gets that for free — both halves are grid items
 * in the same row, so the widget stretches to the cluster's natural height.
 *
 * DOM order is widget-then-cluster: the calendar leads, the icons follow.
 * Arabic flips it the same way Compose does in RTL, which is why there is not a
 * single left/right class in here.
 *
 * Only the Smart Stack's first page (Today) is ported. The Android widget is a
 * three-page vertical pager; a swipeable stack on a page that already scrolls
 * vertically would fight the page, so the calendar face renders on its own.
 */

/**
 * Intrinsic size of the tile art, for `next/image` — the rendered size comes
 * from the grid, not from here.
 *
 * A note on the corner radius the tiles are clipped at, which is a PERCENTAGE
 * rather than a length. The Android artwork bakes its own rounded corners into
 * the alpha channel, and the set is not consistent: the roundest tiles cut at
 * 29.2% of their width, the bell at 19.3%, and several are plain squares. A CSS
 * radius SMALLER than a tile's baked one leaves the page showing through inside
 * the corner of the box — a white notch on a light theme — so the clip has to be
 * at least as round as the roundest art in the set. 29.2% is exactly that, it
 * squares up the tiles that carry no corners of their own, and being relative it
 * holds at any rendered size.
 *
 * Android pins its icons at 64dp inside cells that are wider than that, and
 * centres them, so the space between two icons is the 14dp column gap plus the
 * slack on either side. Rendering that literally on the web left the tiles
 * small and the gaps loose, because the phone dashboard's container is wider
 * than the padded Android grid. Here the icon fills its cell instead, so the
 * only gap anywhere is the grid's own — 32px between columns, 20px between
 * rows — and the tiles are as large as the row allows. The widget's card spans
 * its half for the same reason: with no slack to clear there is nothing to
 * inset it by, and its edges already line up with the icons beside it.
 */
const ICON_PX = 192

interface Tile {
  /** Key under school.dashboard.homeWidget.tiles */
  key: "notifications" | "messages" | "lumos" | "subjects"
  /** Tile art, lifted from the Android drawables */
  src: string
  href: string
  fallback: string
}

/* Four tiles from the Android home grid, each with its own artwork.
   Notifications and Messages take the first row, where the Android cluster puts
   Grades and Fees; Lumos and Subjects keep the second row. */
const TILES: Tile[] = [
  {
    key: "notifications",
    src: "/tiles/notifications.png",
    href: "/notifications",
    fallback: "Notifications",
  },
  {
    key: "messages",
    src: "/tiles/message.png",
    href: "/messages",
    fallback: "Messages",
  },
  { key: "lumos", src: "/tiles/stream.png", href: "/lumos", fallback: "Lumos" },
  {
    key: "subjects",
    src: "/tiles/subject.png",
    href: "/subjects",
    fallback: "Subjects",
  },
]

interface HomeBlockClientProps {
  locale: string
  /** School events dated today — the widget's bottom line. */
  eventsToday: number
  className?: string
}

export function HomeBlockClient({
  locale,
  eventsToday,
  className,
}: HomeBlockClientProps) {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.homeWidget as
    | {
        today?: string
        eventsToday?: string
        noEvents?: string
        tiles?: Record<string, string>
      }
    | undefined

  // Device clock, like the Android widget — the day number has to agree with
  // the phone the reader is holding, not with the server's timezone.
  const now = new Date()
  const weekday = now.toLocaleDateString(locale, { weekday: "long" })

  const eventsLine =
    eventsToday > 0
      ? (dict?.eventsToday || "{count} events today").replace(
          "{count}",
          String(eventsToday)
        )
      : dict?.noEvents || "No events today"

  return (
    /* No ground of its own: the tiles sit straight on the page the way they sit
       on a wallpaper. The next-action banner below it keeps the brand green —
       one green surface on the page reads as a statement, two read as a theme.

       Every horizontal gap in the block is 32px — between the two halves and
       between the cluster's own columns alike — rather than Android's tighter
       14dp. The row gap stays at Android's 20dp, so the block reads as columns
       of tiles rather than a dense grid.

       The block bleeds to the viewport edges and pays 16px of it back as inner
       padding, which is exactly where the dashboard container puts its own
       content — so the widget's card and the outer icons line up with the
       next-action banner below rather than sitting 8px inside it. The padding
       is horizontal only: the rhythm above and below belongs to the
       dashboard's `space-y-6`, and a `py` here would stack with it. */
    <div
      className={cn(
        "grid grid-cols-2 gap-x-8 px-4 md:hidden",
        // Full bleed: the dashboard container is centred in the viewport, so
        // half its own width less half the viewport is exactly the inset to
        // give back on each side. Symmetric, so it needs no logical variant.
        "mx-[calc(50%-50vw)]",
        className
      )}
      // suppressHydrationWarning: the day number is read from the clock, so a
      // render either side of midnight can legitimately disagree.
      suppressHydrationWarning
    >
      {/* Widget column — card on top, its own label at the bottom, so the label
          lines up with the labels of the cluster's second row. */}
      <div className="flex flex-col gap-[5px]">
        <div className="flex flex-1 flex-col rounded-[28px] bg-[#9fe5b1] p-4 shadow-md">
          <p className="truncate text-[20px] leading-7 font-bold text-[#FF3B30]">
            {weekday}
          </p>
          <p
            className="text-[84px] leading-[84px] font-bold tracking-[-4px] text-[#050505]"
            suppressHydrationWarning
          >
            {now.getDate()}
          </p>
          <div className="flex-1" />
          <p className="text-[13px] leading-4 font-medium text-[#050505]/55">
            {eventsLine}
          </p>
        </div>
        <span className="text-foreground truncate text-center text-[13px] leading-4 font-semibold">
          {dict?.today || "Today"}
        </span>
      </div>
      {/* Icon cluster — 2x2. Columns are 32px, matching the channel to the
          widget rather than Android's tighter 14dp, so every horizontal gap in
          the block is the same; rows keep Android's 20dp. */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {TILES.map((tile) => (
          <Link
            key={tile.key}
            href={`/${locale}${tile.href}`}
            className="flex flex-col items-center gap-[5px] focus:outline-none"
          >
            <Image
              src={tile.src}
              alt=""
              width={ICON_PX}
              height={ICON_PX}
              sizes="25vw"
              className="aspect-square w-full rounded-[29.2%] object-cover shadow-md"
            />
            <span className="text-foreground max-w-full truncate text-[13px] leading-4 font-semibold">
              {dict?.tiles?.[tile.key] || tile.fallback}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
