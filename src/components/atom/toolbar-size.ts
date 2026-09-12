// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The size of an icon control in a menu a thumb operates.
 *
 * Two menus need these numbers: the school dashboard's phone toolbar row
 * (`template/mobile-nav`) and the school marketing nav's utility panel
 * (`template/zenda-nav`). Both hold the same four or six controls — search,
 * language, theme, account, and on the dashboard the bell and the mail — and
 * when the numbers lived in each file the two drifted into six sizes between
 * them. Named once so they cannot.
 *
 * 40px target, 24px glyph. Bigger than the 28-32px these same controls take in
 * the desktop header they were borrowed from, which is the point: a header is
 * read with a pointer and a menu with a thumb.
 *
 * `TOOLBAR_BUTTON` is written as descendant-scoped variants because the
 * controls come from six different components and `Button` sizes an unsized
 * child svg from a selector no rule on an ancestor can outrank — so the button
 * box is set from the row, and each glyph takes `TOOLBAR_ICON` through its own
 * prop. `[&>a]` is there for the one control that renders as a link.
 */
export const TOOLBAR_ICON = "size-6"

export const TOOLBAR_BUTTON = "[&>a]:size-10 [&>button]:size-10"
