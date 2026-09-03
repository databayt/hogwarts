// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * One tile in the row that runs under a title card — the reference app's
 * episode shelf, the strip of artwork you scroll sideways once you have read
 * the thing above it.
 *
 * It was the lumos lesson page's "More from Course" row first, written inline.
 * The live room needs the same shelf under its own title card, and this block
 * has already paid for that twice: `TitleCard` moved here for exactly this
 * reason, and the landing strip and catch-up shelf drifted within a day of
 * being written separately. So the tile moved here and both pages draw it.
 *
 * Purely presentational, like the card above it. The meta line is a SLOT
 * because the two callers describe genuinely different things — a lesson has a
 * chapter number and a runtime, a class has a clock time and a status — and
 * neither belongs in here.
 */
export function ShelfCard({
  href,
  title,
  thumbnailUrl,
  color,
  meta,
  overlay,
  className,
}: {
  href: string
  /** Set OVER the artwork, as the reference sets an episode's name. */
  title: string
  thumbnailUrl?: string | null
  /** The ground when there is no artwork — the subject's own colour. A normal
   *  state, not a fallback: CloudFront is optional. */
  color?: string | null
  /** The glass bar's contents. */
  meta?: React.ReactNode
  /** Anything pinned to the tile's top corner — a status mark. */
  overlay?: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative w-60 shrink-0 overflow-hidden rounded-lg",
        className
      )}
    >
      <div
        className="relative aspect-[3/2]"
        style={{ backgroundColor: color || "#1a1a1a" }}
      >
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="240px"
            unoptimized
          />
        )}

        {/* The name, centred on the picture rather than set under it — the
            reference does the same, and it is what lets a tile be artwork
            with a label rather than a card with a caption. */}
        <p className="absolute inset-0 line-clamp-2 flex items-center px-3 text-start text-sm font-bold text-white drop-shadow-md">
          {title}
        </p>

        {overlay}

        {meta && (
          /* Apple's liquid glass: a blurred, masked strip that lets the
             artwork through while keeping 12px type legible over any of it. */
          <div
            className="absolute inset-x-0 bottom-0 z-10 px-2.5 pt-4 pb-1"
            style={{
              background:
                "linear-gradient(to top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
              backdropFilter: "blur(8px) saturate(110%)",
              WebkitBackdropFilter: "blur(8px) saturate(110%)",
              maskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
            }}
          >
            {/* ONE line, always. The bar is 16px of 12px type sitting in a
                mask that fades out above it, so a second line renders half
                outside the glass and over bare artwork. `min-w-0` is what
                lets a caller's `truncate` actually bite. */}
            <div className="flex min-w-0 items-center gap-1 text-xs whitespace-nowrap text-white/80">
              {meta}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

/**
 * The rail the tiles sit on. A class string rather than a component: both
 * callers already own the element that wraps their own heading, and the only
 * thing that has to agree between them is how the row scrolls.
 *
 * The negative margin and matching padding are what let a tile's focus ring
 * show without the row clipping it.
 */
export const shelfScroller =
  "no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
