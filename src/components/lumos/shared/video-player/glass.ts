// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"

/**
 * The Apple-TV surface the lumos player is built from: a dark translucent
 * pane over the video, blurred hard enough that the frame behind it reads as
 * texture rather than content. `backdrop-filter` is the whole effect, so the
 * background stays a low-alpha wash — raising it past ~0.5 turns the pill
 * into a solid chip and the blur stops registering.
 *
 * Kept as a plain style object because Tailwind's `bg-*` utilities cannot
 * express this alpha without a custom token, and both the player and the live
 * room need the exact same value to look like one system.
 */
export const glassSurface = {
  background: "rgba(20, 20, 20, 0.4)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
} as const

/** A glass container: the surface above plus the blur that makes it glass. */
export const glassPill = "rounded-full backdrop-blur-[40px]"

/** A glass control — the pill, plus the player's press/hover feel. */
export const glassButton = cn(
  glassPill,
  "cursor-pointer transition-all duration-150",
  "hover:bg-[rgba(40,40,40,0.6)] active:opacity-60",
  "focus:outline-none"
)

/**
 * A menu floating over the video. Squarer than the pills (a list of rows in a
 * circle-ended box reads wrong) and a shade more opaque, because text has to
 * survive whatever frame is behind it.
 */
export const glassMenu =
  "rounded-xl border border-white/10 bg-black/80 backdrop-blur-[40px]"

/**
 * The band under the bottom chrome. Controls sit on video, and a white slide
 * or a bright classroom would swallow them; the scrim buys contrast without
 * a hard edge across the frame.
 */
export const glassScrim = "bg-gradient-to-t from-black/80 to-transparent"

/**
 * The bottom card of the player's phone layout — the scrubber, the clock and
 * the row of controls in one rounded pane. Squarer than the pills, like the
 * menu, but on the pill's surface: it holds controls rather than text, so it
 * can stay as translucent as they are.
 */
export const glassPanel = "rounded-2xl backdrop-blur-[40px]"
