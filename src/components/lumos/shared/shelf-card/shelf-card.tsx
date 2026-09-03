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
 * TWO label placements, because the reference itself has both. Over the
 * artwork is the lumos lesson row: a name on a picture, with the numbers in a
 * glass bar at its foot. Below the artwork is the reference's own episode and
 * bonus rows — an eyebrow, a name, and a couple of lines of prose that would
 * be unreadable set over a photograph. Which one a caller wants is a fact
 * about its content, not about this component.
 */
export function ShelfCard({
  href,
  title,
  thumbnailUrl,
  color,
  meta,
  overlay,
  className,
  aspectClassName = "aspect-[3/2]",
  titleBelow = false,
  eyebrow,
  blurb,
  art,
}: {
  href: string
  /** Set OVER the artwork by default, under it when `titleBelow`. */
  title: string
  thumbnailUrl?: string | null
  /** The ground when there is no artwork — the subject's own colour. A normal
   *  state, not a fallback: CloudFront is optional. */
  color?: string | null
  /** The glass bar's contents. Only drawn with the title over the artwork —
   *  under it there is real room for the numbers, in `blurb`. */
  meta?: React.ReactNode
  /** Anything pinned to the tile's top corner — a status mark. */
  overlay?: React.ReactNode
  className?: string
  aspectClassName?: string
  /** The reference's episode and bonus rows. */
  titleBelow?: boolean
  /** The reference's `EPISODE 1` — above the name, only when `titleBelow`. */
  eyebrow?: React.ReactNode
  /** The two or three lines under the name, only when `titleBelow`. */
  blurb?: React.ReactNode
  /** Drawn centred on the colour when there is no artwork at all. A class's
   *  attached exam or worksheet has none and never will. */
  art?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative w-60 shrink-0 text-start",
        !titleBelow && "overflow-hidden rounded-lg",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          titleBelow ? "rounded-lg" : "",
          aspectClassName
        )}
        style={{ backgroundColor: color || "#1a1a1a" }}
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="240px"
            unoptimized
          />
        ) : (
          art && (
            <span className="absolute inset-0 flex items-center justify-center text-white/70">
              {art}
            </span>
          )
        )}

        {!titleBelow && (
          /* The name, centred on the picture rather than set under it — what
             lets a tile be artwork with a label rather than a card with a
             caption. */
          <p className="absolute inset-0 line-clamp-2 flex items-center px-3 text-sm font-bold text-white drop-shadow-md">
            {title}
          </p>
        )}

        {overlay}

        {meta && !titleBelow && (
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

      {titleBelow && (
        // Labels UNDER the artwork read on the page's own ground, not over a
        // picture — so they take the theme's tokens, dark in light mode and
        // light in dark. The over-artwork title above keeps its hard white,
        // because there it always sits on a photograph.
        <div className="pt-2">
          {eyebrow && (
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {eyebrow}
            </p>
          )}
          <p className="text-foreground line-clamp-2 text-[15px] leading-tight font-semibold">
            {title}
          </p>
          {blurb && (
            <p className="text-muted-foreground mt-1 line-clamp-3 text-[13px] leading-[17px]">
              {blurb}
            </p>
          )}
        </div>
      )}
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
