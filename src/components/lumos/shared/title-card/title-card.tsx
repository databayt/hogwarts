// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * The Apple-TV title card: artwork edge to edge, a long fade up from the
 * bottom, and the whole identity stack sitting in that fade — badge, title,
 * byline, one meta line, a row of chips, then a white pill that starts the
 * thing.
 *
 * It was the lumos lesson hero first, written inline in
 * `lumos/dashboard/lesson/content.tsx`. The live room needs the same card in
 * front of a class, and this block's own records are explicit about what
 * happens when a card gets written twice: the landing strip and the past shelf
 * drifted within a day of each other. So the frame moved here and both callers
 * draw it.
 *
 * Purely presentational. Every row is a slot, because the two callers have
 * genuinely different content — a lesson has a chapter and a runtime, a class
 * has a section and a start time — and nothing about that belongs in here.
 *
 * TWO layouts, one DOM. Above `sm` it is the wide overlay: the stack sits in
 * the fade, start-aligned, marks above the button. On a phone it becomes the
 * reference app's PHONE page — title and meta centred over the artwork, then a
 * solid black shelf carrying a full-width button with the marks under it.
 *
 * The phone layout is not a nicety. The overlay squashed into a 390px-wide
 * strip put five rows of text over the picture at once, and both callers had
 * it. Same reason the frame is shared at all: one card, one set of decisions.
 */

interface TitleCardProps {
  /** The frame's own sizing. Lumos is a 16:9 box in a scrolling page, the
   *  room is the whole viewport, so the caller owns it. */
  className?: string
  thumbnailUrl?: string | null
  /** The ground behind the artwork, and the whole card when there is none —
   *  a normal state, not a fallback: CloudFront is optional. */
  color?: string | null
  /** Alt text for the artwork. */
  alt: string
  /** The POSTER's own sizing on a phone, where its height comes from the
   *  card's width (`aspect-[4/5]`) rather than from the screen. That is the
   *  right default — it is the reference's ratio — but it means a short phone
   *  gets the same 469px of artwork a tall one does, and the block runs off
   *  the bottom. A caller that has to fit the viewport clamps it here. Owned
   *  by the caller for the same reason `className` is: the two callers sit in
   *  genuinely different boxes. */
  posterClassName?: string
  /** Sizes hint for the artwork, per the caller's layout. */
  sizes?: string
  /** The reference's `‹ Back`, over the artwork on the inline-start side. */
  topStart?: React.ReactNode
  /** Its `+ ADD` and share, on the inline-end side. The phone layout puts the
   *  secondary action up here rather than beside the button, which is what
   *  leaves the button free to run the full width. */
  topEnd?: React.ReactNode
  badges?: React.ReactNode
  title: string
  byline?: React.ReactNode
  meta?: React.ReactNode
  chips?: React.ReactNode
  /** The white pill. The only required row — a card with nothing to start is
   *  a picture. */
  action: React.ReactNode
  secondary?: React.ReactNode
  /** The reference's paragraph under the button. Optional: a card with
   *  nothing to say omits the row rather than padding it. */
  description?: React.ReactNode
  /** Anything that has to sit UNDER the button row — a refusal, a warning.
   *  Its own line, so the row above it keeps the exact geometry the reference
   *  has (a flex column wrapped around the pill changes how it sizes). */
  note?: React.ReactNode
}

export function TitleCard({
  className,
  thumbnailUrl,
  color,
  alt,
  posterClassName,
  sizes = "(max-width: 768px) 100vw, 800px",
  topStart,
  topEnd,
  badges,
  title,
  byline,
  meta,
  chips,
  action,
  secondary,
  description,
  note,
}: TitleCardProps) {
  return (
    // A SECTION on a phone, a stacking context above `sm`.
    //
    // The reference's first block is 646px tall on a 390px frame and the page
    // scrolls past it into more blocks — it is not a screen. So the poster is
    // 4:5 (390x487.5, exactly the frame) and the stack FLOWS after it; the
    // card takes the height its content needs and whatever follows follows.
    // Locking this to the viewport, which is what it did, is what forced the
    // title 269px below where the frame puts it.
    <div
      className={cn("relative flex w-full flex-col sm:block", className)}
      style={{ backgroundColor: color || "#1a1a1a" }}
    >
      <div
        className={cn(
          "relative aspect-[4/5] w-full shrink-0 overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto sm:h-full",
          posterClassName
        )}
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={alt}
            fill
            className="object-cover"
            sizes={sizes}
            unoptimized
          />
        ) : null}
        {/* The fade the title sits in. Only on a phone: above `sm` the whole
            stack carries its own, because there the artwork runs full height. */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/70 to-transparent sm:hidden" />
      </div>

      {(topStart || topEnd) && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 sm:p-6">
          <div className="flex items-center gap-2">{topStart}</div>
          <div className="flex items-center gap-2">{topEnd}</div>
        </div>
      )}

      <div className="relative flex flex-1 flex-col sm:absolute sm:inset-x-0 sm:bottom-0 sm:flex-none sm:bg-gradient-to-t sm:from-black/90 sm:via-black/50 sm:to-transparent sm:pt-32">
        {/* A fixed BAND lifted back over the artwork's last stretch, bottom
            aligned. The frame runs its title and info line from y=380 to 459
            under a poster ending at 487.5 — an 80px band whose foot sits 28px
            above where the artwork stops, which is `-mt-[108px]` on `h-20`.
            The band is what makes this height-independent: pulling the block
            up by a constant put its TOP in the right place only for the exact
            rows it happened to have that day, and it moved 90px the moment the
            badge and the byline came off. Taller content overflows upward into
            the fade, which is where there is room for it. */}
        <div className="-mt-[108px] flex h-20 flex-col justify-end px-4 text-center sm:mt-0 sm:block sm:h-auto sm:px-6 sm:text-start">
          {badges && (
            <div className="mb-2 flex justify-center gap-1.5 sm:justify-start">
              {badges}
            </div>
          )}

          {/* The frame sets its title as a 50px logo. 28px is what that reads
              as in type at this width without wrapping a long subject. */}
          <h1 className="text-[28px] leading-[34px] font-bold tracking-tight text-white sm:text-4xl sm:leading-none">
            {title}
          </h1>

          {byline && (
            <div className="mt-1.5 flex items-center justify-center gap-2 sm:justify-start">
              {byline}
            </div>
          )}

          {meta && (
            <div className="mt-1 flex items-center justify-center gap-2 text-[13px] text-[#8E8E93] sm:justify-start sm:text-sm sm:text-white">
              {meta}
            </div>
          )}
        </div>

        {/* The ground. 16px above the button and 16px between it and the
            marks, both off the frame; the black then runs to the foot of the
            card, as the poster's end runs into the page there. */}
        <div className="mt-4 flex flex-1 flex-col gap-4 bg-black px-4 pb-6 sm:mt-0 sm:flex-none sm:gap-0 sm:bg-transparent sm:px-6">
          <div className="order-1 flex items-center justify-center gap-3 sm:order-3 sm:mt-4 sm:justify-start">
            {action}
            {secondary}
          </div>

          {description && (
            /* The frame's paragraph, between the button and the marks. It is
               the only start-set copy in the block on a phone, which is what
               the marks under it align to. */
            <div className="order-2 text-[15px] leading-[20px] text-white sm:hidden">
              {description}
            </div>
          )}

          {chips && (
            /* Start-aligned on a phone, like the reference's row at x=16 — it
               sits under a left-set description there, and a centred row of
               boxes under a centred title reads as a caption rather than as
               the specification it is. */
            <div className="order-3 flex flex-wrap items-center gap-1.5 text-sm text-white sm:order-1 sm:mt-2">
              {chips}
            </div>
          )}

          {note && <div className="order-4">{note}</div>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The card's parts, as class strings rather than components.
//
// Every one of these is worn by an element the caller has to own anyway — a
// `<span>` here, a `<Link>` there, a `<button>` with its own handler — so
// wrapping them in components would buy nothing and cost each caller a prop
// passthrough. Exported so "the same card" means the same strings, not two
// copies that agree today.
// ---------------------------------------------------------------------------

/**
 * A control in the row over the artwork, worn by `topStart` / `topEnd`.
 *
 * The reference sets `‹ Back` and its share glyph bare on the picture — no
 * disc, no plate — and carries them on a drop shadow instead, which is what
 * keeps them readable over a bright frame without putting a second surface
 * between the reader and the artwork.
 */
export const titleCardTopGlyph =
  "inline-flex items-center gap-1 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-opacity hover:opacity-80"

/**
 * The reference's `+ ADD`: the one control up there that is a BUTTON rather
 * than a glyph, so it gets an outline to say so. Same drop shadow as its
 * neighbours — the outline alone disappears over a pale frame.
 */
export const titleCardTopPill =
  "inline-flex h-8 items-center gap-1 rounded-full border border-white/70 px-3 text-[13px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-colors hover:bg-white/15 disabled:opacity-50"

/** The dark chip above the title. Grade, on both callers. */
export const titleCardBadge =
  "rounded-md border border-white/30 bg-black/60 px-2.5 text-xs font-medium text-white backdrop-blur-sm"

/** The quill beside the byline name. Inverted to white — the source art is
 *  black on transparent. */
export const titleCardBylineIcon = "rounded-sm brightness-0 invert"

export const titleCardBylineName = "text-sm font-medium text-white"

/** The soft chip that ends the meta line and opens the long version. */
export const titleCardMoreChip =
  "shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25"

/**
 * An outlined mark: CC, AD, free, and anything else that is a fact about the
 * thing rather than a claim about its quality.
 *
 * On a phone these are the reference's exactly — a 13px-tall box of 11px type
 * in systemGray (#8D8D93), 6px apart. Not white: the reference reserves white
 * for the title, the description and the buttons, and a row of white boxes
 * under a white paragraph flattens the whole block. Above `sm` they stay as
 * the wide card has always drawn them.
 */
export const titleCardChip =
  "rounded-[3px] border border-[#8D8D93] px-1 text-[11px] leading-[13px] text-[#8D8D93] sm:rounded sm:border-white sm:px-1.5 sm:text-xs sm:leading-normal sm:text-white"

/** The one filled mark — `4K` on the reference. Filled in the same grey, with
 *  the type knocked out in black. */
export const titleCardChipSolid =
  "rounded-[3px] bg-[#8D8D93] px-1 text-[11px] leading-[13px] font-medium text-black sm:rounded sm:bg-white sm:px-1.5 sm:text-xs sm:leading-normal"

/**
 * The button. `px-6` when it carries a word, `px-5` when it also carries a
 * progress track.
 *
 * On a phone it is the reference's: 42px tall, an 8px radius — a rounded
 * RECTANGLE, not a pill — and filled `#F2F2F7` rather than pure white. Those
 * three came off the Figma frame with a pixel ruler (fill sampled at its
 * centre, height 475→516, and the corner arc reaching the straight edge seven
 * rows down). Above `sm` it stays the pill the wide card has always had.
 *
 * Literal hex rather than a token because this surface is pinned dark: a
 * theme-aware token here would invert the button in light mode, which is
 * exactly backwards over artwork.
 */
export const titleCardPill =
  "inline-flex h-[42px] items-center gap-2 rounded-[8px] bg-[#F2F2F7] px-6 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40 sm:h-10 sm:rounded-full sm:bg-white"

/** The round glass button beside the pill. */
export const titleCardRoundButton =
  "inline-flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"

/** The feather, at the size both callers set it. */
export function TitleCardFeather({ alt }: { alt: string }) {
  return (
    <Image
      src="/feather.png"
      alt={alt}
      width={16}
      height={16}
      className={titleCardBylineIcon}
    />
  )
}
