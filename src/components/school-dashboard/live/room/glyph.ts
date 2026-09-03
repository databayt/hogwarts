// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A control on the room's glass: a bare glyph, no word, a ground only while
 * it is hovered or holding a state. The player's phone chrome draws every
 * control this way — the word lives on `aria-label`, so a screen reader loses
 * nothing. `size-11` is the 44px touch target; the row's centre grows past it.
 */
export const glyph =
  "flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-40"

/** The row's centre — the one control the reference draws larger. */
export const glyphLarge = "size-14"
