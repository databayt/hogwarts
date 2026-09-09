// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import { BookCover } from "./book-cover"

interface Props {
  coverUrl?: string | null
  coverColor?: string | null
  title: string
  author: string
  width: number
  height: number
  priority?: boolean
  textSize?: "sm" | "md" | "lg"
  /** Sizing and shadow. The jacket owns the shape; the caller owns the box. */
  className?: string
}

/**
 * Cover art wearing a jacket, so it reads as a book rather than a picture.
 *
 * Flat artwork in a rounded rectangle is a thumbnail. Three things turn it
 * into an object, and the reference uses all three: a crease down the binding
 * edge, a highlight running off it where the light catches the fold, and
 * corners that are square at the spine and round at the fore-edge.
 *
 * All of that is pinned to the PHYSICAL left, not the inline start, and stays
 * there in Arabic. The spine belongs to the artwork, and artwork does not
 * mirror — a Western cover flipped to bind on the right has its own printed
 * spine on one side and ours on the other. This is the one place in the block
 * where a physical direction is the correct answer.
 */
export function BookJacket({
  coverUrl,
  coverColor,
  title,
  author,
  width,
  height,
  priority,
  textSize,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-l-[2px] rounded-r-md",
        className
      )}
      style={{ backgroundColor: coverColor || "#1a1a2e" }}
    >
      <BookCover
        coverUrl={coverUrl}
        coverColor={coverColor}
        title={title}
        author={author}
        width={width}
        height={height}
        priority={priority}
        textSize={textSize}
      />

      {/* The binding, in two layers because one does not survive both kinds of
          cover. A white highlight alone vanishes on a white jacket, and a dark
          crease alone vanishes on a black one — so the gutter darkens first
          and the board catches the light just inside it. Between them there is
          an edge on any artwork.

          Percentages, not pixels: one jacket dresses a 192px hero cover and a
          112px shelf cover, and a fixed 8px band is a stripe on the small one. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3%] bg-gradient-to-r from-black/45 to-black/5" />
      <div className="pointer-events-none absolute inset-y-0 left-[3%] w-[5%] bg-gradient-to-r from-white/45 to-transparent" />

      {/* Keeps a pale cover from dissolving into a pale ground. */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/10 ring-inset" />
    </div>
  )
}
